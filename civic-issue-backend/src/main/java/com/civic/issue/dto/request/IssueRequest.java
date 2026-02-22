package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
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

    private Double latitude;

    private Double longitude;
}
