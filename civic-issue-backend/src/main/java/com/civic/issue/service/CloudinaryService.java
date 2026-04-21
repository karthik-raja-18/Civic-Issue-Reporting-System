package com.civic.issue.service;

import com.civic.issue.dto.response.UploadResponse;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    private final Cloudinary cloudinary;
    
    @Value("${twilio.account.sid}")
    private String twilioSid;

    @Value("${twilio.auth.token}")
    private String twilioToken;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    /**
     * Specialized method for the Web UI (MultipartFile upload).
     */
    public UploadResponse uploadEvidenceImage(MultipartFile file, String capturedAt, Double lat, Double lng, String email) throws IOException {
        log.info("Uploading evidence image from user: {}", email);
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        
        return UploadResponse.builder()
                .imageUrl((String) uploadResult.get("secure_url"))
                .publicId((String) uploadResult.get("public_id"))
                .build();
    }

    /**
     * Uploads an image from a URL (Bot Workflow). 
     * If it's a Twilio URL, it downloads it first to avoid 401 Unauthorized.
     */
    public String uploadImage(String imageUrl) {
        try {
            Object uploadSource = imageUrl;

            if (imageUrl.contains("twilio.com")) {
                log.info("Downloading protected media from Twilio...");
                byte[] imageBytes = downloadTwilioMedia(imageUrl);
                uploadSource = imageBytes;
            }

            Map<?, ?> uploadResult = cloudinary.uploader().upload(uploadSource, ObjectUtils.emptyMap());
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("Cloudinary upload success: {}", secureUrl);
            return secureUrl;
        } catch (Exception e) {
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw new RuntimeException("Image upload failed: " + e.getMessage());
        }
    }

    private byte[] downloadTwilioMedia(String url) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        
        String auth = twilioSid + ":" + twilioToken;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.add("Authorization", "Basic " + encodedAuth);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);

        if (response.getStatusCode().is2xxSuccessful()) {
            return response.getBody();
        } else {
            throw new RuntimeException("Failed to download Twilio media. Status: " + response.getStatusCode());
        }
    }
}