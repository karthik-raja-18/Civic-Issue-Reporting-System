package com.civic.issue.dto.response;

public class UploadResponse {
    private String imageUrl;
    private String publicId;

    public UploadResponse() {}

    public UploadResponse(String imageUrl, String publicId) {
        this.imageUrl = imageUrl;
        this.publicId = publicId;
    }

    // Manual Builder
    public static UploadResponseBuilder builder() {
        return new UploadResponseBuilder();
    }

    public static class UploadResponseBuilder {
        private UploadResponse res = new UploadResponse();
        public UploadResponseBuilder imageUrl(String url) { res.imageUrl = url; return this; }
        public UploadResponseBuilder publicId(String id) { res.publicId = id; return this; }
        public UploadResponse build() { return res; }
    }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }
}
