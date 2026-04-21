package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;

public class ResolveIssueRequest {

    @NotBlank(message = "Resolved proof photo URL is required")
    private String resolvedImageUrl;

    private String resolvedImagePublicId;

    public ResolveIssueRequest() {}

    public String getResolvedImageUrl() { return resolvedImageUrl; }
    public void setResolvedImageUrl(String url) { this.resolvedImageUrl = url; }
    public String getResolvedImagePublicId() { return resolvedImagePublicId; }
    public void setResolvedImagePublicId(String id) { this.resolvedImagePublicId = id; }
}
