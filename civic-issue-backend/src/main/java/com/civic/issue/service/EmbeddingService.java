package com.civic.issue.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Generates text embeddings using Google's text-embedding-004 model (free tier).
 *
 * An embedding is a 768-dimension vector of floats that represents the
 * SEMANTIC MEANING of a piece of text — texts with similar meaning produce
 * vectors that are close together in this 768-dimensional space.
 *
 * This is the "R" (Retrieval) foundation of the RAG pipeline:
 *   1. Embed all closed issues once (background job)
 *   2. Embed the citizen's question at query time
 *   3. Find issues whose embeddings are closest to the question's embedding
 *      using cosine similarity
 *   4. Feed only those relevant issues into Gemini as grounding context
 *
 * Free tier: 1500 requests/day — same quota family as Gemini Flash.
 */
@Slf4j
@Service
public class EmbeddingService {

    @Value("${gemini.api.key:NOTSET}")
    private String apiKey;

    private static final String EMBED_URL =
        "https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=";

    /**
     * Converts a piece of text into a 768-dim embedding vector.
     * Returns null if embeddings are unavailable (key missing / API error) —
     * callers must handle null gracefully and skip semantic features.
     */
    public float[] embed(String text) {
        if (isKeyMissing()) {
            log.warn("Gemini API key not configured — embeddings disabled");
            return null;
        }
        if (text == null || text.isBlank()) return null;

        try {
            String requestBody = """
                {
                  "model": "models/gemini-embedding-001",
                  "content": { "parts": [{ "text": "%s" }] },
                  "taskType": "RETRIEVAL_DOCUMENT"
                }
                """.formatted(escapeJson(truncate(text, 2000)));

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(8)).build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(EMBED_URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = client.send(
                    request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Embedding API error {}: {}", response.statusCode(), response.body());
                return null;
            }

            return parseEmbedding(response.body());

        } catch (Exception e) {
            log.error("Embedding generation failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Same as embed() but uses RETRIEVAL_QUERY task type — Gemini optimises
     * the vector slightly differently for "this is a search query" vs
     * "this is a document being indexed". Always use this for the citizen's
     * incoming chat question; use embed() for storing issue descriptions.
     */
    public float[] embedQuery(String text) {
        if (isKeyMissing() || text == null || text.isBlank()) return null;
        try {
            String requestBody = """
                {
                  "model": "models/gemini-embedding-001",
                  "content": { "parts": [{ "text": "%s" }] },
                  "taskType": "RETRIEVAL_QUERY"
                }
                """.formatted(escapeJson(truncate(text, 2000)));

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(8)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(EMBED_URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(15))
                    .build();
            HttpResponse<String> response = client.send(
                    request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Embedding query API error {}: {}", response.statusCode(), response.body());
                return null;
            }
            return parseEmbedding(response.body());
        } catch (Exception e) {
            log.error("Embedding query failed: {}", e.getMessage());
            return null;
        }
    }

    // ── Parsing ───────────────────────────────────────────────────────────────

    private float[] parseEmbedding(String body) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(body);
            JsonNode values = root.path("embedding").path("values");
            List<Float> list = new ArrayList<>();
            values.forEach(v -> list.add((float) v.asDouble()));
            float[] arr = new float[list.size()];
            for (int i = 0; i < arr.length; i++) arr[i] = list.get(i);
            return arr;
        } catch (Exception e) {
            log.error("Failed to parse embedding response: {}", e.getMessage());
            return null;
        }
    }

    private boolean isKeyMissing() {
        return apiKey == null || apiKey.isBlank()
                || apiKey.equals("NOTSET")
                || apiKey.equals("YOUR_GEMINI_API_KEY_HERE");
    }

    private String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }

    private String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
