package com.civic.issue.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.civic.issue.dto.response.UploadResponse;
import com.civic.issue.exception.IssueRejectionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/jpg", "image/png",
            "image/webp", "image/gif", "image/heic", "image/heif"
    );

    public UploadResponse uploadEvidenceImage(
            MultipartFile file,
            String capturedAt,
            Double latitude,
            Double longitude,
            String uploadedBy) throws IOException {

        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IssueRejectionException("Image file is required.");
        }

        String contentType = file.getContentType();
        log.info("Upload | user={} | type={} | size={}KB",
                uploadedBy, contentType, file.getSize() / 1024);

        if (contentType != null && !contentType.startsWith("image/")) {
            throw new IssueRejectionException(
                    "Only image files accepted. Got: " + contentType);
        }

        if (file.getSize() > 10L * 1024 * 1024) {
            throw new IssueRejectionException("Image must be under 10 MB.");
        }

        // Validate coordinates (optional)
        if (latitude != null && (latitude < -90 || latitude > 90)) {
            throw new IssueRejectionException("Invalid latitude.");
        }
        if (longitude != null && (longitude < -180 || longitude > 180)) {
            throw new IssueRejectionException("Invalid longitude.");
        }

        // NO time validation — capturedAt is metadata only

        String context = String.format("user=%s|lat=%s|lng=%s",
                uploadedBy != null  ? uploadedBy          : "unknown",
                latitude   != null  ? latitude.toString() : "unknown",
                longitude  != null  ? longitude.toString(): "unknown");

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = (Map<String, Object>)
                    cloudinary.uploader().upload(
                            file.getBytes(),
                            ObjectUtils.asMap(
                                    "folder",        "civicpulse/evidence",
                                    "context",       context,
                                    "resource_type", "image",
                                    "type",          "upload",
                                    "access_mode",   "public"
                            )
                    );

            String secureUrl = (String) result.get("secure_url");
            String publicId  = (String) result.get("public_id");

            if (secureUrl == null || secureUrl.isBlank()) {
                throw new IOException("Cloudinary returned empty URL. Check credentials.");
            }

            log.info("✅ Uploaded | url={}", secureUrl);

            return UploadResponse.builder()
                    .imageUrl(secureUrl)
                    .publicId(publicId)
                    .build();

        } catch (IssueRejectionException | IOException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Upload failed: {}", e.getMessage(), e);
            throw new IOException("Upload failed: " + e.getMessage(), e);
        }
    }
}