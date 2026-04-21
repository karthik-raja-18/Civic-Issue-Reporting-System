package com.civic.issue.dto.response;

import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id;
    private String message;
    private LocalDateTime createdAt;
    private boolean read;

    public NotificationResponse() {}

    public NotificationResponse(Long id, String message, LocalDateTime createdAt, boolean read) {
        this.id = id;
        this.message = message;
        this.createdAt = createdAt;
        this.read = read;
    }

    // Getters
    public Long getId() { return id; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isRead() { return read; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setMessage(String message) { this.message = message; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setRead(boolean read) { this.read = read; }

    // Manual Builder
    public static NotificationResponseBuilder builder() {
        return new NotificationResponseBuilder();
    }

    public static class NotificationResponseBuilder {
        private NotificationResponse res = new NotificationResponse();
        public NotificationResponseBuilder id(Long id) { res.id = id; return this; }
        public NotificationResponseBuilder message(String message) { res.message = message; return this; }
        public NotificationResponseBuilder createdAt(LocalDateTime dt) { res.createdAt = dt; return this; }
        public NotificationResponseBuilder read(boolean read) { res.read = read; return this; }
        public NotificationResponse build() { return res; }
    }
}
