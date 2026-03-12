package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IssueRequest {
    @NotBlank(message = "CAPTCHA verification is required")
    private String captchaToken;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be under 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    private String imageUrl;
    private String imagePublicId;

    private Double latitude;

    private Double longitude;
}
