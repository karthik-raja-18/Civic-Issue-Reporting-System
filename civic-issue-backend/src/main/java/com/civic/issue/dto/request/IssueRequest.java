package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String imageUrl;

    @NotNull(message = "Location is required")
    private Double latitude;

    @NotNull(message = "Location is required")
    private Double longitude;

    @NotBlank(message = "CAPTCHA verification is required")
    private String captchaToken;

    /**
     * If true, skip duplicate check and allow submission.
     * Set by frontend when reporter clicks "Submit Anyway" on duplicate warning.
     */
    private boolean skipDuplicateCheck = false;
}
