package com.civic.issue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Sent from frontend when reporter clicks "Validate with AI"
 * (after photo is uploaded to Cloudinary but before final submit).
 */
@Data
public class AiValidateRequest {

    @NotBlank
    private String imageUrl;      // Cloudinary URL of uploaded photo

    @NotBlank
    private String title;

    private String description;

    @NotBlank
    private String category;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;
}
