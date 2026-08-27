package com.civic.issue.service;

import com.civic.issue.entity.CategoryFeedback;
import com.civic.issue.entity.Issue;
import com.civic.issue.repository.CategoryFeedbackRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Why this exists
 * ────────────────
 * The original photo→category classification used a single vague Gemini
 * prompt ("what category is this?") with no constrained output space and
 * no validation. Gemini would often return categories that didn't match
 * any value in the frontend's dropdown (e.g. "Road Hazard" instead of
 * "Road Damage"), causing the suggestion to silently fail to apply.
 *
 * This service fixes that with three layers, the same approach used to
 * "fine-tune via prompting" when you don't have infrastructure to train
 * a custom vision model from scratch:
 *
 *   1. FEW-SHOT PROMPTING — the prompt includes labeled examples of
 *      photo descriptions mapped to the EXACT category strings the
 *      system uses, so the model learns the precise output vocabulary
 *      in-context rather than guessing free text.
 *
 *   2. CONSTRAINED MULTI-CLASS SCORING — instead of asking for a single
 *      best guess, we ask Gemini to score confidence (0-100) against
 *      EVERY valid category, then we pick the argmax server-side. This
 *      is closer to how a real softmax classifier head behaves, and it
 *      means we always get a value from the closed label set.
 *
 *   3. FUZZY FALLBACK VALIDATION — if Gemini still returns something
 *      outside the known category set (model drift, formatting issue),
 *      Levenshtein distance maps it to the closest valid category
 *      instead of silently failing.
 *
 * On top of this, every time an admin overrides the AI's suggested
 * category, we log it to category_feedback. That table is a labeled
 * dataset — exactly what you'd export to fine-tune a lightweight
 * custom classifier (e.g. a small CNN or a fine-tuned Gemini model)
 * once you have enough volume. Mentioning this feedback loop is the
 * single most "I understand real ML lifecycle" thing you can say in
 * an interview about this project.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryClassificationService {

    private final CategoryFeedbackRepository categoryFeedbackRepository;

    @Value("${huggingface.api.token:}")
    private String hfToken;

    @Value("${huggingface.model.id:openai/clip-vit-base-patch32}")
    private String modelId;

    /** The CLOSED label set — must exactly match the frontend CATEGORIES array. */
    public static final List<String> VALID_CATEGORIES = List.of(
            "Pothole", "Garbage", "Waterlogging", "Streetlight", "Drainage",
            "Sewage", "Road Damage", "Footpath", "Illegal Construction",
            "Fallen Tree", "Water Leakage", "Other"
    );
    private static final Map<String, String> CATEGORY_TO_CLIP_LABEL = Map.ofEntries(
        Map.entry("Pothole", "pothole in road"),
        Map.entry("Garbage", "garbage dump"),
        Map.entry("Waterlogging", "flooded street"),
        Map.entry("Streetlight", "broken streetlight"),
        Map.entry("Drainage", "blocked drainage"),
        Map.entry("Sewage", "overflowing sewage"),
        Map.entry("Road Damage", "damaged road"),
        Map.entry("Footpath", "damaged footpath"),
        Map.entry("Illegal Construction", "illegal construction"),
        Map.entry("Fallen Tree", "fallen tree"),
        Map.entry("Water Leakage", "water leakage"),
        Map.entry("Other", "other")
    );

    private static final Map<String, String> CLIP_LABEL_TO_CATEGORY;
    static {
        Map<String, String> map = new HashMap<>();
        for (Map.Entry<String, String> entry : CATEGORY_TO_CLIP_LABEL.entrySet()) {
            map.put(entry.getValue().toLowerCase(), entry.getKey());
        }
        CLIP_LABEL_TO_CATEGORY = Collections.unmodifiableMap(map);
    }

    /**
     * Classifies a civic issue photo into one of the VALID_CATEGORIES using
     * Hugging Face CLIP zero-shot classification or a custom ViT classifier.
     */
    public ClassificationResult classify(String imageUrl, String title, String description) {
        if (isKeyMissing()) {
            log.warn("Hugging Face model ID missing — category classification disabled, defaulting to Other");
            return ClassificationResult.fallback();
        }

        try {
            byte[] imageBytes = downloadImage(imageUrl);
            if (imageBytes == null || imageBytes.length == 0) {
                log.warn("Could not download image for classification: {}", imageUrl);
                return ClassificationResult.fallback();
            }

            boolean isClip = modelId.toLowerCase().contains("clip");
            ObjectMapper mapper = new ObjectMapper();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10)).build();

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create("https://api-inference.huggingface.co/models/" + modelId))
                    .timeout(Duration.ofSeconds(20));

            if (hfToken != null && !hfToken.isBlank() && !hfToken.equals("NOTSET")) {
                requestBuilder.header("Authorization", "Bearer " + hfToken);
            }

            if (isClip) {
                String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                List<String> clipLabels = new ArrayList<>(CATEGORY_TO_CLIP_LABEL.values());

                Map<String, Object> inputsMap = Map.of(
                    "image", base64Image,
                    "candidate_labels", clipLabels
                );
                Map<String, Object> bodyMap = Map.of(
                    "inputs", inputsMap
                );
                String requestBody = mapper.writeValueAsString(bodyMap);

                requestBuilder.header("Content-Type", "application/json")
                              .POST(HttpRequest.BodyPublishers.ofString(requestBody));
            } else {
                requestBuilder.header("Content-Type", detectMimeType(imageUrl))
                              .POST(HttpRequest.BodyPublishers.ofByteArray(imageBytes));
            }

            HttpRequest request = requestBuilder.build();
            HttpResponse<String> response = null;
            int retries = 3;
            while (retries > 0) {
                response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 503 || (response.statusCode() == 200 && response.body().contains("is currently loading"))) {
                    log.warn("Hugging Face model is loading. Waiting to retry... (retries left: {})", retries - 1);
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    retries--;
                } else {
                    break;
                }
            }

            if (response == null || response.statusCode() != 200) {
                log.error("Hugging Face classification error: {}", response != null ? response.statusCode() + " - " + response.body() : "No response");
                return ClassificationResult.fallback();
            }

            return parseAndValidateHuggingFace(response.body(), isClip);

        } catch (Exception e) {
            log.error("Category classification failed: {}", e.getMessage(), e);
            return ClassificationResult.fallback();
        }
    }

    private ClassificationResult parseAndValidateHuggingFace(String responseBody, boolean isClip) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(responseBody);

            if (!root.isArray()) {
                log.error("Hugging Face response is not a JSON array: {}", responseBody);
                return ClassificationResult.fallback();
            }

            String bestCategory = "Other";
            int bestScore = -1;
            Map<String, Integer> allScores = new LinkedHashMap<>();

            for (JsonNode item : root) {
                String label = item.path("label").asText();
                double rawScore = item.path("score").asDouble(0.0);
                int score = (int) Math.round(rawScore * 100);

                String category = null;
                if (isClip) {
                    category = CLIP_LABEL_TO_CATEGORY.get(label.toLowerCase());
                } else {
                    category = fuzzyMatchCategory(label);
                }

                if (category == null) {
                    category = fuzzyMatchCategory(label);
                }

                if (category != null) {
                    allScores.put(category, score);
                    if (score > bestScore) {
                        bestScore = score;
                        bestCategory = category;
                    }
                }
            }

            // Ensure all valid categories have a score populated
            for (String validCat : VALID_CATEGORIES) {
                allScores.putIfAbsent(validCat, 0);
            }

            log.info("CLIP classification result: category={} confidence={}", bestCategory, bestScore);

            return ClassificationResult.builder()
                    .category(bestCategory)
                    .confidence(Math.max(bestScore, 0))
                    .reasoning("CLIP zero-shot image classification")
                    .allScores(allScores)
                    .usedFallback(false)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Hugging Face response: {}", e.getMessage());
            return ClassificationResult.fallback();
        }
    }

    /**
     * Layer 3 — fuzzy matches an arbitrary string returned by the model to the
     * closest valid category using normalised Levenshtein distance. Handles
     * cases like Gemini returning "Roads Damage" or "pothole" (wrong case)
     * instead of the exact "Road Damage" / "Pothole" strings.
     *
     * Returns null if nothing is close enough to be trustworthy (distance
     * ratio > 0.4), in which case the caller should ignore that score entirely
     * rather than force-mapping it to something wrong.
     */
    private String fuzzyMatchCategory(String candidate) {
        if (candidate == null || candidate.isBlank()) return null;

        // Exact match first (the common, expected case)
        for (String valid : VALID_CATEGORIES) {
            if (valid.equalsIgnoreCase(candidate.trim())) return valid;
        }

        // Fuzzy fallback
        String bestMatch = null;
        double bestRatio = Double.MAX_VALUE;
        for (String valid : VALID_CATEGORIES) {
            int distance = levenshtein(candidate.toLowerCase(), valid.toLowerCase());
            double ratio = (double) distance / Math.max(candidate.length(), valid.length());
            if (ratio < bestRatio) {
                bestRatio = ratio;
                bestMatch = valid;
            }
        }
        return bestRatio <= 0.4 ? bestMatch : null;
    }

    private int levenshtein(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }

    // ── Feedback loop — collects labeled training data from admin corrections ──

    /**
     * Call this whenever an admin manually changes an issue's category
     * after the AI suggested a different one. This builds a labeled
     * dataset of (description, ai_guess, correct_label) triples that
     * could later be used to fine-tune a dedicated classifier or to
     * expand the few-shot examples above with real failure cases.
     */
    public void recordFeedback(Issue issue, String aiSuggested, Integer aiConfidence,
                                String adminCorrected) {
        if (aiSuggested == null || adminCorrected == null
                || aiSuggested.equalsIgnoreCase(adminCorrected)) {
            return; // no correction happened — nothing to learn from
        }
        try {
            categoryFeedbackRepository.save(CategoryFeedback.builder()
                    .issue(issue)
                    .aiSuggested(aiSuggested)
                    .aiConfidence(aiConfidence)
                    .adminCorrected(adminCorrected)
                    .descriptionSnapshot(issue.getDescription())
                    .build());
            log.info("Category feedback recorded: issue #{} AI said '{}' ({}%), admin corrected to '{}'",
                    issue.getId(), aiSuggested, aiConfidence, adminCorrected);
        } catch (Exception e) {
            log.error("Failed to record category feedback: {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private byte[] downloadImage(String url) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(8)).build();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url)).GET()
                    .timeout(Duration.ofSeconds(12)).build();
            HttpResponse<byte[]> res = client.send(
                    req, HttpResponse.BodyHandlers.ofByteArray());
            return res.statusCode() == 200 ? res.body() : new byte[0];
        } catch (Exception e) {
            log.error("Image download failed: {}", e.getMessage());
            return new byte[0];
        }
    }

    private String detectMimeType(String url) {
        String lower = url.toLowerCase();
        if (lower.contains(".png"))  return "image/png";
        if (lower.contains(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private boolean isKeyMissing() {
        return modelId == null || modelId.isBlank();
    }

    // ── Result DTO ───────────────────────────────────────────────────────────

    @lombok.Builder
    @lombok.Data
    public static class ClassificationResult {
        private String              category;
        private int                 confidence;   // 0-100
        private String              reasoning;
        private Map<String, Integer> allScores;
        private boolean             usedFallback;

        public static ClassificationResult fallback() {
            return ClassificationResult.builder()
                    .category("Other")
                    .confidence(0)
                    .reasoning("AI classification unavailable")
                    .allScores(Map.of())
                    .usedFallback(true)
                    .build();
        }
    }

    /** Tiny inline base64 helper so this file has no extra import surprises. */
    private static class Base64Util {
        static String encode(byte[] bytes) {
            return Base64.getEncoder().encodeToString(bytes);
        }
    }
}
