package com.civic.issue.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AiValidationResponse {

    private boolean valid;
    private String  message;

    // Category classification (fix10 — multi-class scored classifier)
    private String  suggestedCategory;
    private Integer categoryConfidence;   // 0-100, from CategoryClassificationService

    private String  descriptionMatch;     // YES | NO | PARTIAL
    private int     aiConfidence;         // 0-100, 0 = AI skipped

    private boolean duplicateFound;
    private Long    duplicateIssueId;
    private String  duplicateIssueTitle;
    private Double  duplicateDistanceMetres;

    // Only set when the duplicate was found via the semantic (embedding)
    // path rather than the exact-category Haversine path — lets the
    // frontend show "94% similar wording" instead of just distance.
    private Long    duplicateSimilarityPercent;
    private boolean isFallback;
}
