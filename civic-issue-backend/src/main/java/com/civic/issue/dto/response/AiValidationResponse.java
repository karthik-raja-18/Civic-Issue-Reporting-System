package com.civic.issue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiValidationResponse {
    private boolean valid;
    private String message;
    private String suggestedCategory;
    private String descriptionMatch;
    private int aiConfidence;
    
    @Builder.Default
    private boolean isFallback = false;
    
    private boolean duplicateFound;
    private Long duplicateIssueId;
    private String duplicateIssueTitle;
    private Double duplicateDistanceMetres;
}
