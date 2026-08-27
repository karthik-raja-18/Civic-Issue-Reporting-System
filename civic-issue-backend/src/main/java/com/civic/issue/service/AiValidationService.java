package com.civic.issue.service;

import com.civic.issue.dto.request.AiValidateRequest;
import com.civic.issue.dto.response.AiValidationResponse;
import com.civic.issue.entity.Issue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Orchestrates the full AI validation pipeline for a new issue submission:
 *   1. Gemini vision check — is this a real civic issue photo?
 *   2. Category classification — multi-class confidence scoring against
 *      the closed label set (replaces the old single-shot guess that was
 *      producing categories the frontend didn't recognise)
 *   3. Duplicate detection — hybrid of:
 *        a) Fast-path exact-category + GPS Haversine check (cheap, fix5)
 *        b) Semantic embedding similarity check (catches duplicates the
 *           exact-category check misses, fix10)
 *      If EITHER finds a match, we report a duplicate — semantic match
 *      takes priority if both fire since it carries a similarity score.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiValidationService {

    private final GeminiService                 geminiService;
    private final CategoryClassificationService  categoryClassificationService;
    private final DuplicateDetectionService      duplicateDetectionService;
    private final SemanticDuplicateService       semanticDuplicateService;

    public AiValidationResponse validate(AiValidateRequest request) {
        try {
            // ── Step 1: Image validity check (Gemini vision) ────────────────────
            GeminiService.GeminiValidationResult aiResult;
            try {
                aiResult = geminiService.validateIssuePhoto(
                        request.getImageUrl(),
                        request.getTitle(),
                        request.getDescription(),
                        request.getCategory()
                );
            } catch (Exception e) {
                log.error("Gemini vision check failed — using fallback: {}", e.getMessage());
                aiResult = GeminiService.GeminiValidationResult.fallbackValid();
            }

            if (!aiResult.isValidImage()) {
                return AiValidationResponse.builder()
                        .valid(false)
                        .message(buildRejectionMessage(aiResult.getRejectionReason()))
                        .suggestedCategory(aiResult.getSuggestedCategory())
                        .descriptionMatch(aiResult.getMatchesDescription())
                        .aiConfidence(aiResult.getConfidence())
                        .duplicateFound(false)
                        .build();
            }

            // ── Step 2: Proper multi-class category classification ──────────────
            // This REPLACES relying on GeminiService's single-shot category
            // guess (which had no validation against the real category list).
            CategoryClassificationService.ClassificationResult classification;
            try {
                classification = categoryClassificationService.classify(
                        request.getImageUrl(), request.getTitle(), request.getDescription());
            } catch (Exception e) {
                log.error("Category classification failed: {}", e.getMessage());
                classification = CategoryClassificationService.ClassificationResult.fallback();
            }

            String message = "✅ Photo verified. Your issue looks valid!";
            if ("NO".equals(aiResult.getMatchesDescription())) {
                message = "⚠️ Photo valid but description may not match the image.";
            } else if ("PARTIAL".equals(aiResult.getMatchesDescription())) {
                message = "✅ Photo verified. Consider updating your description.";
            }

            // ── Step 3a: Fast-path exact-category duplicate check ───────────────
            Optional<Issue> exactDuplicate = Optional.empty();
            try {
                exactDuplicate = duplicateDetectionService.findNearbyDuplicate(
                        request.getLatitude(), request.getLongitude(), request.getCategory());
            } catch (Exception e) {
                log.error("Exact duplicate check failed — skipping: {}", e.getMessage());
            }

            // ── Step 3b: Semantic duplicate check (catches cross-category dupes) ─
            Optional<SemanticDuplicateService.SemanticDuplicateResult> semanticDuplicate
                    = Optional.empty();
            try {
                semanticDuplicate = semanticDuplicateService.findSemanticDuplicate(
                        request.getDescription(), request.getLatitude(), request.getLongitude());
            } catch (Exception e) {
                log.error("Semantic duplicate check failed — skipping: {}", e.getMessage());
            }

            // Prefer the semantic match when both exist — it carries richer
            // evidence (a similarity score) for the frontend to display.
            if (semanticDuplicate.isPresent()) {
                var sd = semanticDuplicate.get();
                return buildDuplicateResponse(message, classification, sd.matchedIssue(),
                        sd.distanceMetres(), sd.similarityScore());
            }

            if (exactDuplicate.isPresent()) {
                Issue dup = exactDuplicate.get();
                double distance = DuplicateDetectionService.haversineMetres(
                        request.getLatitude(), request.getLongitude(),
                        dup.getLatitude(), dup.getLongitude());
                return buildDuplicateResponse(message, classification, dup, distance, null);
            }

            // ── No duplicates — all clear ────────────────────────────────────────
            return AiValidationResponse.builder()
                    .valid(true)
                    .message(message)
                    .suggestedCategory(classification.getCategory())
                    .categoryConfidence(classification.getConfidence())
                    .descriptionMatch(aiResult.getMatchesDescription())
                    .aiConfidence(aiResult.getConfidence())
                    .duplicateFound(false)
                    .build();

        } catch (Exception e) {
            log.error("AI validation completely failed: {}", e.getMessage(), e);
            return AiValidationResponse.builder()
                    .valid(true)
                    .message("⚠️ AI verification unavailable. You can still submit.")
                    .aiConfidence(0)
                    .duplicateFound(false)
                    .build();
        }
    }

    private AiValidationResponse buildDuplicateResponse(
            String message,
            CategoryClassificationService.ClassificationResult classification,
            Issue dup, double distanceMetres, Double semanticSimilarity) {

        log.info("Duplicate found: Issue #{} '{}' distance={}m semanticSimilarity={}",
                dup.getId(), dup.getTitle(), Math.round(distanceMetres),
                semanticSimilarity != null ? Math.round(semanticSimilarity * 100) + "%" : "n/a");

        return AiValidationResponse.builder()
                .valid(true)
                .message(message)
                .suggestedCategory(classification.getCategory())
                .categoryConfidence(classification.getConfidence())
                .duplicateFound(true)
                .duplicateIssueId(dup.getId())
                .duplicateIssueTitle(dup.getTitle())
                .duplicateDistanceMetres(Math.round(distanceMetres * 10.0) / 10.0)
                .duplicateSimilarityPercent(semanticSimilarity != null
                        ? Math.round(semanticSimilarity * 100) : null)
                .build();
    }

    private String buildRejectionMessage(String reason) {
        if (reason == null || "NONE".equals(reason)) {
            return "❌ The photo doesn't appear to show a valid civic issue. Please take a clear photo of the actual problem.";
        }
        return "❌ Photo rejected: " + reason +
               " Please take a clear photo showing the actual civic issue.";
    }
}
