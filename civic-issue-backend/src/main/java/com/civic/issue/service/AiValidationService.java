package com.civic.issue.service;

import com.civic.issue.dto.request.AiValidateRequest;
import com.civic.issue.dto.response.AiValidationResponse;
import com.civic.issue.entity.Issue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiValidationService {

    private final GeminiService             geminiService;
    private final DuplicateDetectionService duplicateDetectionService;

    public AiValidationResponse validate(AiValidateRequest request) {
        try {
            System.out.println(">>> [DEBUG] Starting AI Validation for: " + (request != null ? request.getTitle() : "NULL"));
            
            if (request == null) {
                return AiValidationResponse.builder()
                        .valid(true).message("⚠️ Invalid request. Skipping AI.").isFallback(true).build();
            }

            if (request.getImageUrl() == null || request.getImageUrl().isBlank()) {
                System.out.println(">>> [DEBUG] No image URL found. Skipping AI.");
                return AiValidationResponse.builder()
                        .valid(true)
                        .message("⚠️ No photo provided. AI check skipped.")
                        .aiConfidence(0)
                        .duplicateFound(false)
                        .isFallback(true) // Added explicit fallback true
                        .build();
            }

            // ── Step 1: Gemini ────────────────────────────────────────────────
            GeminiService.GeminiValidationResult aiResult;
            try {
                aiResult = geminiService.validateIssuePhoto(
                        request.getImageUrl(),
                        request.getTitle(),
                        request.getDescription(),
                        request.getCategory()
                );
            } catch (Exception e) {
                System.err.println(">>> [ERROR] Gemini call failed: " + e.getMessage());
                aiResult = GeminiService.GeminiValidationResult.fallbackValid();
            }

            if (aiResult == null) aiResult = GeminiService.GeminiValidationResult.fallbackValid();

            log.info("AI result for '{}': valid={} confidence={}",
                    request.getTitle(), aiResult.isValidImage(), aiResult.getConfidence());

            // ── Hard reject ───────────────────────────────────────────────────
            if (!aiResult.isValidImage() || !aiResult.isMatchesCategory()) {
                String reason = aiResult.getRejectionReason();
                
                if (aiResult.isValidImage() && !aiResult.isMatchesCategory()) {
                    reason = "❌ Category Mismatch: The photo appears to show '" + aiResult.getSuggestedCategory() + 
                             "', but you selected '" + request.getCategory() + "'. Please choose the correct category.";
                } else if (reason == null || "NONE".equals(reason) || "Unknown failure".equals(reason)) {
                    reason = "❌ Photo doesn't show a valid civic issue. Please take a clear photo of the problem.";
                }

                return AiValidationResponse.builder()
                        .valid(false)
                        .message(reason)
                        .suggestedCategory(aiResult.getSuggestedCategory())
                        .descriptionMatch(aiResult.getMatchesDescription())
                        .aiConfidence(aiResult.getConfidence())
                        .duplicateFound(false)
                        .isFallback(aiResult.isFallback())
                        .build();
            }

            // ── Message ───────────────────────────────────────────────────────
            String message;
            if (aiResult.isFallback()) {
                message = "⚠️ AI verification is currently undergoing maintenance. Your report is being accepted for manual district review.";
            } else if ("NO".equals(aiResult.getMatchesDescription())) {
                message = "⚠️ Photo verified but your description doesn't seem to match the visual evidence. Please ensure details are accurate.";
            } else if ("PARTIAL".equals(aiResult.getMatchesDescription())) {
                message = "✅ Photo verified. Consider refining your description for faster processing.";
            } else {
                message = "✅ Photo verified. Your issue has been successfully validated by AI.";
            }

            // ── Step 2: Duplicate check ───────────────────────────────────────
            Optional<Issue> duplicate = Optional.empty();
            if (request.getLatitude() != null && request.getLongitude() != null) {
                try {
                    duplicate = duplicateDetectionService.findNearbyDuplicate(
                            request.getLatitude(),
                            request.getLongitude(),
                            request.getCategory()
                    );
                } catch (Exception e) {
                    System.err.println(">>> [ERROR] Duplicate check failed: " + e.getMessage());
                }
            }

            if (duplicate.isPresent()) {
                Issue dup = duplicate.get();
                // Safe distance calculation (handle nulls if any)
                double dist = 0;
                try {
                    if (dup.getLatitude() != null && dup.getLongitude() != null) {
                        dist = DuplicateDetectionService.haversineMetres(
                                request.getLatitude(), request.getLongitude(),
                                dup.getLatitude(), dup.getLongitude());
                    }
                } catch (Exception e) {
                    System.err.println(">>> [ERROR] Distance calculation failed: " + e.getMessage());
                }

                log.info("Duplicate found: Issue #{} '{}' at {}m away",
                        dup.getId(), dup.getTitle(), Math.round(dist));

                return AiValidationResponse.builder()
                        .valid(true)
                        .message(message)
                        .suggestedCategory(aiResult.getSuggestedCategory())
                        .descriptionMatch(aiResult.getMatchesDescription())
                        .aiConfidence(aiResult.getConfidence())
                        .duplicateFound(true)
                        .duplicateIssueId(dup.getId())
                        .duplicateIssueTitle(dup.getTitle())
                        .duplicateDistanceMetres(Math.round(dist * 10.0) / 10.0)
                        .isFallback(aiResult.isFallback())
                        .build();
            }

            return AiValidationResponse.builder()
                    .valid(true)
                    .message(message)
                    .suggestedCategory(aiResult.getSuggestedCategory())
                    .descriptionMatch(aiResult.getMatchesDescription())
                    .aiConfidence(aiResult.getConfidence())
                    .duplicateFound(false)
                    .isFallback(aiResult.isFallback())
                    .build();

        } catch (Throwable t) {
            // ✅ Use Throwable to catch ABSOLUTELY EVERYTHING (Errors, NPEs, etc)
            System.err.println(">>> [FATAL ERROR] AI validation crashed: " + t.getMessage());
            t.printStackTrace();
            return AiValidationResponse.builder()
                    .valid(true)
                    .message("⚠️ AI verification unavailable. You can still submit.")
                    .aiConfidence(0)
                    .duplicateFound(false)
                    .isFallback(true)
                    .build();
        }
    }

}