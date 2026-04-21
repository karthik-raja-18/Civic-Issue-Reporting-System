package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

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

    private String captchaToken;

    private boolean skipDuplicateCheck = false;

    public IssueRequest() {}

    // Getters
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getImageUrl() { return imageUrl; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getCaptchaToken() { return captchaToken; }
    public boolean isSkipDuplicateCheck() { return skipDuplicateCheck; }

    // Setters
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(String category) { this.category = category; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setCaptchaToken(String captchaToken) { this.captchaToken = captchaToken; }
    public void setSkipDuplicateCheck(boolean skipDuplicateCheck) { this.skipDuplicateCheck = skipDuplicateCheck; }
}
