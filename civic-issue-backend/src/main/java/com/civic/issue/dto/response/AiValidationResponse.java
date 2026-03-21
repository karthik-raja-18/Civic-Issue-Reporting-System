package com.civic.issue.dto.response;

import lombok.*;

/**
 * Returned from POST /api/issues/validate-ai
 * Frontend uses this to show AI validation feedback before final submit.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiValidationResponse {

    /** Whether the image passes AI validation */
    private boolean valid;

    /** Human-readable reason shown to the reporter if invalid */
    private String message;

    /** Category Gemini thinks best matches the photo */
    private String suggestedCategory;

    /** Whether photo matches the description */
    private String descriptionMatch;   // YES | NO | PARTIAL

    /** 0–100 — 0 means AI was skipped (fallback) */
    private int aiConfidence;

    /** If the AI service was bypassed (timeout/error/unavail) */
    private boolean isFallback;

    /** If a nearby duplicate was found */
    private boolean duplicateFound;

    /** ID of the existing duplicate issue (so frontend can link to it) */
    private Long duplicateIssueId;

    /** Title of the duplicate issue */
    private String duplicateIssueTitle;

    /** Distance in metres to the duplicate */
    private Double duplicateDistanceMetres;
}
