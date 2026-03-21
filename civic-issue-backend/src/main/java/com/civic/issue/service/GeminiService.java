package com.civic.issue.service;

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
import java.util.Base64;

/**
 * Calls Google Gemini 1.5 Flash to validate uploaded civic issue photos.
 *
 * Free tier: 1500 requests/day, 15 requests/min — enough for a civic app.
 * Get your API key at: https://aistudio.google.com/
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private static final String VALIDATION_PROMPT = """
        You are a civic issue validator for a government complaint system in Coimbatore, India.

        A citizen has submitted a photo along with:
        - Title: %s
        - Description: %s
        - Category: %s

        Analyse the photo carefully and answer these 5 questions:

        1. VALID_IMAGE: Is this image clearly showing a real civic/public infrastructure issue?
           Valid issues: pothole, broken road, garbage/waste dump, waterlogging, broken streetlight,
           open manhole, damaged footpath, sewage overflow, illegal construction, fallen tree/branch,
           water pipe leakage, damaged public property. 
           CRITICAL: If the image is pitch black, completely blurry, a selfie, a screenshot of text, 
           or doesn't show any recognizable civic feature, answer NO.
           
        2. MATCHES_DESCRIPTION: Does what you see in the photo match the title and description given?
           Answer YES, NO, or PARTIAL.

        3. SUGGESTED_CATEGORY: Based on the photo, what is the most accurate category?
           Choose ONE from: Pothole, Garbage, Waterlogging, Streetlight, Drainage, Sewage,
           Road Damage, Footpath, Illegal Construction, Fallen Tree, Water Leakage, Other

        4. MATCHES_CATEGORY: Does the photo contain elements that match the selected category '%s'?
           Answer YES or NO.

        5. REJECTION_REASON: If the image is NOT valid (not a real civic issue, blurry/dark/unclear,
           random photo, selfie, screenshot, etc.) OR if it completely doesn't match the selected category,
           explain briefly why it was rejected. 
           If valid, write NONE.

        Reply ONLY in this exact JSON format, no extra text:
        {
          "validImage": true or false,
          "matchesDescription": "YES" or "NO" or "PARTIAL",
          "suggestedCategory": "category name",
          "matchesCategory": true or false,
          "rejectionReason": "reason or NONE",
          "confidence": 0-100
        }
        """;

    /**
     * Validates a civic issue photo using Gemini Vision.
     *
     * @param imageUrl   Public Cloudinary URL of the uploaded photo
     * @param title      Issue title from the form
     * @param description Issue description from the form
     * @param category   Category selected by the user
     * @return GeminiValidationResult with all validation details
     */
    public GeminiValidationResult validateIssuePhoto(
            String imageUrl, String title, String description, String category) {

        try {
            // Download image bytes from Cloudinary and convert to base64
            byte[] imageBytes = downloadImage(imageUrl);
            if (imageBytes == null || imageBytes.length == 0) {
                log.warn("Could not download image from: {}", imageUrl);
                return GeminiValidationResult.fallbackValid(); // Don't block on download failure
            }

            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String mimeType    = detectMimeType(imageUrl);

            String prompt = String.format(VALIDATION_PROMPT, title, description, category, category);

            // Build Gemini API request body
            String requestBody = """
                {
                  "contents": [{
                    "parts": [
                      {
                        "inline_data": {
                          "mime_type": "%s",
                          "data": "%s"
                        }
                      },
                      {
                        "text": "%s"
                      }
                    ]
                  }],
                  "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 300
                  }
                }
                """.formatted(mimeType, base64Image, escapeJson(prompt));

            HttpClient  client  = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = client.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 429) {
                log.warn("Gemini rate limit hit — allowing submission");
                return GeminiValidationResult.fallbackValid();
            }

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {} — {}", response.statusCode(), response.body());
                return GeminiValidationResult.fallbackValid();
            }

            return parseGeminiResponse(response.body());

        } catch (Exception e) {
            log.error("Gemini validation failed: {}", e.getMessage());
            return GeminiValidationResult.fallbackValid(); // Fail open — don't block users on AI error
        }
    }

    // ── Parsing ───────────────────────────────────────────────────────────────

    private GeminiValidationResult parseGeminiResponse(String responseBody) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(responseBody);

            // Extract text from Gemini response structure
            String text = root
                    .path("candidates").get(0)
                    .path("content")
                    .path("parts").get(0)
                    .path("text")
                    .asText();

            // Strip markdown code blocks if Gemini wraps in ```json
            text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

            JsonNode parsed = mapper.readTree(text);

            return GeminiValidationResult.builder()
                    .validImage(parsed.path("validImage").asBoolean(false))
                    .matchesDescription(parsed.path("matchesDescription").asText("NO"))
                    .suggestedCategory(parsed.path("suggestedCategory").asText("Other"))
                    .matchesCategory(parsed.path("matchesCategory").asBoolean(false))
                    .rejectionReason(parsed.path("rejectionReason").asText("Unknown failure"))
                    .confidence(parsed.path("confidence").asInt(0))
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            return GeminiValidationResult.fallbackValid();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private byte[] downloadImage(String url) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(8))
                    .build();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(12))
                    .build();
            HttpResponse<byte[]> res = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
            return res.statusCode() == 200 ? res.body() : new byte[0];
        } catch (Exception e) {
            log.error("Image download failed: {}", e.getMessage());
            return new byte[0];
        }
    }

    private String detectMimeType(String url) {
        String lower = url.toLowerCase();
        if (lower.contains(".jpg") || lower.contains(".jpeg") || lower.contains("f_jpg"))
            return "image/jpeg";
        if (lower.contains(".png"))  return "image/png";
        if (lower.contains(".webp")) return "image/webp";
        return "image/jpeg"; // Cloudinary default
    }

    private String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    // ── Result DTO (inner record) ─────────────────────────────────────────────

    @lombok.Builder
    @lombok.Data
    public static class GeminiValidationResult {
        private boolean validImage;
        private String  matchesDescription;  // YES | NO | PARTIAL
        private String  suggestedCategory;
        private boolean matchesCategory;
        private String  rejectionReason;
        private int     confidence;
        private boolean isFallback;

        /** Used when Gemini is unavailable — we fail open (don't block users) */
        public static GeminiValidationResult fallbackValid() {
            return GeminiValidationResult.builder()
                    .validImage(true)
                    .matchesDescription("YES")
                    .suggestedCategory("Other")
                    .matchesCategory(true)
                    .rejectionReason("NONE")
                    .confidence(0)
                    .isFallback(true)
                    .build();
        }

        public boolean isDescriptionMismatch() {
            return "NO".equals(matchesDescription);
        }
    }
}
