package com.civic.issue.service;

import com.civic.issue.dto.request.AiValidateRequest;
import com.civic.issue.dto.response.AiValidationResponse;
import com.civic.issue.entity.Issue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Orchestrates both AI image validation (Gemini) and duplicate detection.
 */
@Service
public class AiValidationService {

    private static final Logger log = LoggerFactory.getLogger(AiValidationService.class);

    private final GeminiService            geminiService;
    private final DuplicateDetectionService duplicateDetectionService;

    public AiValidationService(GeminiService geminiService, DuplicateDetectionService duplicateDetectionService) {
        this.geminiService = geminiService;
        this.duplicateDetectionService = duplicateDetectionService;
    }

    public AiValidationResponse validate(AiValidateRequest request) {

        // Now passing only 1 argument as per new GeminiService signature
        GeminiService.GeminiValidationResult aiResult = geminiService.validateIssuePhoto(
                request.getImageUrl()
        );

        log.info("AI validation mapping for '{}': suggestedCategory={}", 
                request.getTitle(), aiResult.getSuggestedCategory());

        if (!aiResult.isValidImage() || !aiResult.matchesCategory()) {
            return AiValidationResponse.builder()
                    .valid(false)
                    .message("❌ AI rejected the image: " + aiResult.getRejectionReason())
                    .suggestedCategory(aiResult.getSuggestedCategory())
                    .descriptionMatch(aiResult.getMatchesDescription())
                    .aiConfidence(aiResult.getConfidence())
                    .isFallback(aiResult.isFallback())
                    .duplicateFound(false)
                    .build();
        }

        String message = "✅ Photo verified. " + aiResult.getGeneratedDescription();
        if (aiResult.isFallback()) {
            message = "⚠️ AI maintenance. Report accepted for review.";
        }

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

            return AiValidationResponse.builder()
                    .valid(true)
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
}
