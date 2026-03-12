package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResolveIssueRequest {

    @NotBlank(message = "Resolved proof photo URL is required")
    private String resolvedImageUrl;

    private String resolvedImagePublicId;
}
