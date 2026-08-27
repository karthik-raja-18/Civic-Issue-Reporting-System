package com.civic.issue.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

/**
 * Pure math utility for vector similarity search — the core retrieval
 * mechanism in RAG. No external library needed; cosine similarity is
 * just dot product normalised by vector magnitude.
 *
 *   cosine_similarity(A, B) = (A · B) / (||A|| * ||B||)
 *
 * Result ranges from -1 (opposite meaning) to 1 (identical meaning).
 * In practice text embeddings rarely go negative — values above 0.75
 * usually indicate strong semantic similarity, above 0.85 near-duplicate.
 */
@Slf4j
public class VectorMathUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /**
     * Computes cosine similarity between two embedding vectors.
     * Returns 0 if either vector is null or empty (safe default — "not similar").
     */
    public static double cosineSimilarity(float[] a, float[] b) {
        if (a == null || b == null || a.length == 0 || b.length == 0 || a.length != b.length) {
            return 0.0;
        }

        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot   += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA == 0.0 || normB == 0.0) return 0.0;

        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /** Serialise a float[] embedding to a JSON array string for DB storage. */
    public static String toJson(float[] vector) {
        if (vector == null) return null;
        try {
            return MAPPER.writeValueAsString(vector);
        } catch (Exception e) {
            log.error("Failed to serialise embedding: {}", e.getMessage());
            return null;
        }
    }

    /** Deserialise a JSON array string back into a float[] embedding. */
    public static float[] fromJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, float[].class);
        } catch (Exception e) {
            log.error("Failed to deserialise embedding: {}", e.getMessage());
            return null;
        }
    }
}
