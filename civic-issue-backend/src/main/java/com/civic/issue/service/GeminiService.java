package com.civic.issue.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private static final String VALIDATION_PROMPT = """
        You are a strict security and validation auditor for the Coimbatore City Corporation.
        Your task is to analyze the provided image and determine if it is a GENUINE, LIVE PHOTO of a civic issue.

        CRITICAL VALIDATION RULES:
        1. REJECT if the image is a screenshot (check for status bars, UI elements, or phone borders).
        2. REJECT if the image is a photo of another screen (check for pixelation, moiré patterns, or reflections on glass).
        3. REJECT if the image looks like a professional stock photo or an internet download.
        4. REJECT if there is no clear civic issue (Pothole, Waste, Water Leak, Broken Streetlight, etc.).
        5. ACCEPT only if it looks like a natural, candid photo taken by a citizen's mobile camera outdoors.

        REQUIRED OUTPUT FIELDS:
        - validImage: true/false (must be false if it's a gallery/fake/screen-photo).
        - suggestedCategory: The most accurate category.
        - generatedDescription: A clear, professional 1-sentence summary of the problem.
        - rejectionReason: If validImage is false, explain why.
        - confidence: 0-100 score of your certainty.
        - matchesDescription: "YES" or "NO" (does it look like a real problem).
        - matchesCategory: true/false.

        JSON FORMAT:
        {
          "validImage": boolean,
          "suggestedCategory": "string",
          "generatedDescription": "string",
          "rejectionReason": "string",
          "confidence": number,
          "matchesDescription": "string",
          "matchesCategory": boolean
        }
        """;

    public GeminiValidationResult validateIssuePhoto(String imageUrl) {
        log.info("Starting AI validation for image: {}", imageUrl);
        try {
            byte[] imageBytes = downloadImage(imageUrl);
            if (imageBytes == null || imageBytes.length == 0) {
                log.warn("Failed to download image. Falling back.");
                return GeminiValidationResult.fallbackValid();
            }

            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String mimeType    = "image/jpeg";

            String requestBody = """
                {
                  "contents": [{
                    "parts": [{"inline_data": {"mime_type": "%s", "data": "%s"}}, {"text": "%s"}]
                  }],
                  "generationConfig": {"temperature": 0.0, "maxOutputTokens": 400}
                }
                """.formatted(mimeType, base64Image, escapeJson(VALIDATION_PROMPT));

            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return GeminiValidationResult.fallbackValid();

            return parseGeminiResponse(response.body());
        } catch (Exception e) {
            log.error("AI check failed: {}", e.getMessage());
            return GeminiValidationResult.fallbackValid();
        }
    }

    private GeminiValidationResult parseGeminiResponse(String responseBody) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(responseBody);
            String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            JsonNode parsed = mapper.readTree(text);

            return GeminiValidationResult.builder()
                    .validImage(parsed.path("validImage").asBoolean(true))
                    .suggestedCategory(parsed.path("suggestedCategory").asText("Other"))
                    .generatedDescription(parsed.path("generatedDescription").asText("Issue reported."))
                    .rejectionReason(parsed.path("rejectionReason").asText("NONE"))
                    .confidence(parsed.path("confidence").asInt(100))
                    .matchesDescription(parsed.path("matchesDescription").asText("YES"))
                    .matchesCategory(parsed.path("matchesCategory").asBoolean(true))
                    .isFallback(false)
                    .build();
        } catch (Exception e) {
            log.error("JSON parse failed: {}", e.getMessage());
            return GeminiValidationResult.fallbackValid();
        }
    }

    private byte[] downloadImage(String url) {
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<byte[]> res = client.send(req, HttpResponse.BodyHandlers.ofByteArray());
            return res.statusCode() == 200 ? res.body() : new byte[0];
        } catch (Exception e) { return new byte[0]; }
    }

    private String escapeJson(String text) {
        return text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    public static class GeminiValidationResult {
        private boolean validImage;
        private String  suggestedCategory;
        private String  generatedDescription;
        private String  rejectionReason;
        private int     confidence;
        private String  matchesDescription;
        private boolean matchesCategory;
        private boolean isFallback;

        public GeminiValidationResult() {}

        public static GeminiValidationResultBuilder builder() { return new GeminiValidationResultBuilder(); }

        public static class GeminiValidationResultBuilder {
            private GeminiValidationResult res = new GeminiValidationResult();
            public GeminiValidationResultBuilder validImage(boolean v) { res.validImage = v; return this; }
            public GeminiValidationResultBuilder suggestedCategory(String s) { res.suggestedCategory = s; return this; }
            public GeminiValidationResultBuilder generatedDescription(String d) { res.generatedDescription = d; return this; }
            public GeminiValidationResultBuilder rejectionReason(String r) { res.rejectionReason = r; return this; }
            public GeminiValidationResultBuilder confidence(int c) { res.confidence = c; return this; }
            public GeminiValidationResultBuilder matchesDescription(String m) { res.matchesDescription = m; return this; }
            public GeminiValidationResultBuilder matchesCategory(boolean m) { res.matchesCategory = m; return this; }
            public GeminiValidationResultBuilder isFallback(boolean f) { res.isFallback = f; return this; }
            public GeminiValidationResult build() { return res; }
        }

        public static GeminiValidationResult fallbackValid() {
            return GeminiValidationResult.builder()
                    .validImage(true).suggestedCategory("Other").generatedDescription("Reported.")
                    .rejectionReason("NONE").confidence(100).matchesDescription("YES").matchesCategory(true)
                    .isFallback(true).build();
        }

        public boolean isValidImage() { return validImage; }
        public String getSuggestedCategory() { return suggestedCategory; }
        public String getGeneratedDescription() { return generatedDescription; }
        public String getRejectionReason() { return rejectionReason; }
        public int getConfidence() { return confidence; }
        public String getMatchesDescription() { return matchesDescription; }
        public boolean matchesCategory() { return matchesCategory; }
        public boolean isFallback() { return isFallback; }
    }
}
