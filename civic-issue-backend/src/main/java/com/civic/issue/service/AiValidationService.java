package com.civic.issue.service;

import com.civic.issue.dto.request.AiValidateRequest;
import com.civic.issue.dto.response.AiValidationResponse;
import com.civic.issue.entity.Issue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Orchestrates both AI image validation (Gemini) and duplicate detection.
 * Called from the new /api/issues/validate-ai endpoint.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiValidationService {

    private final GeminiService            geminiService;
    private final DuplicateDetectionService duplicateDetectionService;

    public AiValidationResponse validate(AiValidateRequest request) {

        // ── Step 1: Gemini image + description validation ─────────────────────
        GeminiService.GeminiValidationResult aiResult = geminiService.validateIssuePhoto(
                request.getImageUrl(),
                request.getTitle(),
                request.getDescription(),
                request.getCategory()
        );

        log.info("AI validation result for '{}': valid={}, confidence={}, reason={}",
                request.getTitle(), aiResult.isValidImage(),
                aiResult.getConfidence(), aiResult.getRejectionReason());

        // If AI says image is invalid OR it completely doesn't match the selected category
        if (!aiResult.isValidImage() || !aiResult.isMatchesCategory()) {
            String reason = buildRejectionMessage(aiResult.getRejectionReason());
            
            // If category mismatch was the reason, refine the message
            if (aiResult.isValidImage() && !aiResult.isMatchesCategory()) {
                reason = String.format("❌ Category Mismatch: The photo appears to show '%s', but you selected '%s'. Please choose the correct category.",
                        aiResult.getSuggestedCategory(), request.getCategory());
            }

            return AiValidationResponse.builder()
                    .valid(false)
                    .message(reason)
                    .suggestedCategory(aiResult.getSuggestedCategory())
                    .descriptionMatch(aiResult.getMatchesDescription())
                    .aiConfidence(aiResult.getConfidence())
                    .isFallback(aiResult.isFallback())
                    .duplicateFound(false)
                    .build();
        }

        // ── Step 2: Formulate message based on results ───────────────────────
        String message;
        if (aiResult.isFallback()) {
            message = "⚠️ AI verification is currently undergoing maintenance. Your report is being accepted for manual district review.";
        } else if (aiResult.isDescriptionMismatch()) {
            message = "⚠️ Photo verified but your description doesn't seem to match the visual evidence. Please ensure your details are accurate.";
        } else if ("PARTIAL".equals(aiResult.getMatchesDescription())) {
            message = "✅ Photo verified. Consider refining your description for faster processing.";
        } else {
            message = "✅ Photo verified. Your issue has been successfully validated by AI.";
        }

        // ── Step 3: Duplicate detection ───────────────────────────────────────
        Optional<Issue> duplicate = duplicateDetectionService.findNearbyDuplicate(
                request.getLatitude(),
                request.getLongitude(),
                request.getCategory()
        );

        if (duplicate.isPresent()) {
            Issue dup = duplicate.get();
            double distance = DuplicateDetectionService.haversineMetres(
                    request.getLatitude(), request.getLongitude(),
                    dup.getLatitude(), dup.getLongitude()
            );

            log.info("Duplicate found: Issue #{} '{}' at {:.0f}m away",
                    dup.getId(), dup.getTitle(), distance);

            return AiValidationResponse.builder()
                    .valid(true)  // Image is valid — but warn about duplicate
                    .message(message)
                    .suggestedCategory(aiResult.getSuggestedCategory())
                    .descriptionMatch(aiResult.getMatchesDescription())
                    .aiConfidence(aiResult.getConfidence())
                    .isFallback(aiResult.isFallback())
                    .duplicateFound(true)
                    .duplicateIssueId(dup.getId())
                    .duplicateIssueTitle(dup.getTitle())
                    .duplicateDistanceMetres(Math.round(distance * 10.0) / 10.0)
                    .build();
        }

        // ── All good ──────────────────────────────────────────────────────────
        return AiValidationResponse.builder()
                .valid(true)
                .message(message)
                .suggestedCategory(aiResult.getSuggestedCategory())
                .descriptionMatch(aiResult.getMatchesDescription())
                .aiConfidence(aiResult.getConfidence())
                .isFallback(aiResult.isFallback())
                .duplicateFound(false)
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
