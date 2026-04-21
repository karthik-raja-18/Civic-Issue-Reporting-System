package com.civic.issue.dto.response;

public class AiValidationResponse {

    private boolean valid;
    private String message;
    private String suggestedCategory;
    private String descriptionMatch;
    private int aiConfidence;
    private boolean isFallback;
    private boolean duplicateFound;
    private Long duplicateIssueId;
    private String duplicateIssueTitle;
    private Double duplicateDistanceMetres;

    public AiValidationResponse() {}

    public static AiValidationResponseBuilder builder() {
        return new AiValidationResponseBuilder();
    }

    public static class AiValidationResponseBuilder {
        private AiValidationResponse res = new AiValidationResponse();
        public AiValidationResponseBuilder valid(boolean v) { res.valid = v; return this; }
        public AiValidationResponseBuilder message(String m) { res.message = m; return this; }
        public AiValidationResponseBuilder suggestedCategory(String s) { res.suggestedCategory = s; return this; }
        public AiValidationResponseBuilder descriptionMatch(String d) { res.descriptionMatch = d; return this; }
        public AiValidationResponseBuilder aiConfidence(int c) { res.aiConfidence = c; return this; }
        public AiValidationResponseBuilder isFallback(boolean f) { res.isFallback = f; return this; }
        public AiValidationResponseBuilder duplicateFound(boolean f) { res.duplicateFound = f; return this; }
        public AiValidationResponseBuilder duplicateIssueId(Long id) { res.duplicateIssueId = id; return this; }
        public AiValidationResponseBuilder duplicateIssueTitle(String t) { res.duplicateIssueTitle = t; return this; }
        public AiValidationResponseBuilder duplicateDistanceMetres(Double d) { res.duplicateDistanceMetres = d; return this; }
        public AiValidationResponse build() { return res; }
    }

    // Manual Getters
    public boolean isValid() { return valid; }
    public String getMessage() { return message; }
    public String getSuggestedCategory() { return suggestedCategory; }
    public String getDescriptionMatch() { return descriptionMatch; }
    public int getAiConfidence() { return aiConfidence; }
    public boolean isFallback() { return isFallback; }
    public boolean isDuplicateFound() { return duplicateFound; }
    public Long getDuplicateIssueId() { return duplicateIssueId; }
    public String getDuplicateIssueTitle() { return duplicateIssueTitle; }
    public Double getDuplicateDistanceMetres() { return duplicateDistanceMetres; }
}
