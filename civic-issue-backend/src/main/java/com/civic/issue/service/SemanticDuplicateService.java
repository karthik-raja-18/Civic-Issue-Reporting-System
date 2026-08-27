package com.civic.issue.service;

import com.civic.issue.entity.Issue;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.util.VectorMathUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Upgraded duplicate detection — combines the original GPS+category exact
 * match (DuplicateDetectionService, kept as-is for fast path) with a
 * SEMANTIC layer that catches duplicates the rule-based system misses.
 *
 * WHY THIS MATTERS
 * ─────────────────
 * The original system requires an EXACT category match within a radius.
 * Two citizens reporting the same physical pothole but picking different
 * categories ("Pothole" vs "Road Damage") would never be flagged — even
 * though they're describing the identical problem in different words.
 *
 *   Issue A: category="Pothole",     desc="Large hole damaging cars on Avinashi Road"
 *   Issue B: category="Road Damage", desc="Deep crater causing vehicle damage near Avinashi"
 *
 *   Rule-based (category-exact) check: NOT flagged ❌
 *   Semantic (embedding similarity) check: ~0.91 cosine similarity → flagged ✅
 *
 * THE HYBRID APPROACH
 * ────────────────────
 * 1. Geographic gate: only compare against issues within a wider radius
 *    (we relax this vs the strict version since category no longer has
 *    to match — semantic similarity does the precision work instead)
 * 2. Semantic gate: embed the new description, compare cosine similarity
 *    against open issues' stored embeddings
 * 3. Combined decision: flag as duplicate if
 *      (GPS distance <= 200m) AND (cosine similarity >= 0.85)
 *    This is intentionally a TIGHTER similarity threshold than a typical
 *    "related articles" recommender (which might use 0.7) because a
 *    false positive here blocks a legitimate citizen report — we'd
 *    rather miss some duplicates than wrongly reject real issues.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SemanticDuplicateService {

    private final IssueRepository   issueRepository;
    private final EmbeddingService  embeddingService;

    @Value("${app.semantic.duplicate.radius.metres:200}")
    private double radiusMetres;

    @Value("${app.semantic.duplicate.similarity.threshold:0.85}")
    private double similarityThreshold;

    @Value("${app.semantic.duplicate.lookback.days:30}")
    private int lookbackDays;

    /**
     * Finds a semantic duplicate of a new issue among currently OPEN issues.
     * Returns empty if embeddings are unavailable (fails open — never blocks
     * submission just because the AI side is down).
     */
    public Optional<SemanticDuplicateResult> findSemanticDuplicate(
            String description, Double latitude, Double longitude) {

        if (latitude == null || longitude == null || description == null || description.isBlank()) {
            return Optional.empty();
        }

        float[] newEmbedding = embeddingService.embed(description);
        if (newEmbedding == null) {
            log.warn("Embeddings unavailable — skipping semantic duplicate check");
            return Optional.empty();
        }

        LocalDateTime since = LocalDateTime.now().minusDays(lookbackDays);

        // Wider bounding box than the strict Haversine check, because we no
        // longer require category match — semantic similarity supplies the
        // precision instead of an exact category filter.
        double latRange = radiusMetres / 111_000.0;
        double lngRange = radiusMetres / (111_000.0 * Math.cos(Math.toRadians(latitude)));

        List<Issue> candidates = issueRepository.findOpenCandidatesNearLocation(
                latitude - latRange, latitude + latRange,
                longitude - lngRange, longitude + lngRange,
                since
        );

        Issue   bestMatch      = null;
        double  bestSimilarity = 0.0;
        double  bestDistance   = 0.0;

        for (Issue candidate : candidates) {
            if (candidate.getStatus() == IssueStatus.CLOSED) continue;
            if (candidate.getLatitude() == null || candidate.getLongitude() == null) continue;

            float[] candidateEmbedding = VectorMathUtil.fromJson(candidate.getEmbedding());
            if (candidateEmbedding == null) continue; // not yet embedded — skip

            double distance = haversineMetres(
                    latitude, longitude, candidate.getLatitude(), candidate.getLongitude());
            if (distance > radiusMetres) continue;

            double similarity = VectorMathUtil.cosineSimilarity(newEmbedding, candidateEmbedding);

            if (similarity >= similarityThreshold && similarity > bestSimilarity) {
                bestMatch      = candidate;
                bestSimilarity = similarity;
                bestDistance   = distance;
            }
        }

        if (bestMatch == null) return Optional.empty();

        log.info("Semantic duplicate found: Issue #{} similarity={} distance={}m",
                bestMatch.getId(), Math.round(bestSimilarity * 100), Math.round(bestDistance));

        return Optional.of(new SemanticDuplicateResult(
                bestMatch, bestSimilarity, bestDistance));
    }

    private double haversineMetres(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng/2) * Math.sin(dLng/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    public record SemanticDuplicateResult(
            Issue matchedIssue, double similarityScore, double distanceMetres) {}
}
