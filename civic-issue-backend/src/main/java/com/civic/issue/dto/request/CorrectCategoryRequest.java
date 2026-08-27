package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CorrectCategoryRequest {

    @NotBlank(message = "New category is required")
    private String newCategory;

    // Optional — the confidence score the AI originally reported for its
    // suggestion, passed through from the frontend so it can be logged
    // alongside the correction in category_feedback.
    private Integer aiConfidenceAtSuggestion;
}
