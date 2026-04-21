package com.civic.issue.dto.response;

import java.time.LocalDateTime;

public class CommentResponse {
    private Long id;
    private String text;
    private LocalDateTime createdAt;
    private String userName;
    private Long userId;

    public CommentResponse() {}

    public CommentResponse(Long id, String text, LocalDateTime createdAt, String userName, Long userId) {
        this.id = id;
        this.text = text;
        this.createdAt = createdAt;
        this.userName = userName;
        this.userId = userId;
    }

    // Getters
    public Long getId() { return id; }
    public String getText() { return text; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getUserName() { return userName; }
    public Long getUserId() { return userId; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setText(String text) { this.text = text; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUserName(String userName) { this.userName = userName; }
    public void setUserId(Long userId) { this.userId = userId; }

    // Manual Builder
    public static CommentResponseBuilder builder() {
        return new CommentResponseBuilder();
    }

    public static class CommentResponseBuilder {
        private CommentResponse res = new CommentResponse();
        public CommentResponseBuilder id(Long id) { res.id = id; return this; }
        public CommentResponseBuilder text(String text) { res.text = text; return this; }
        public CommentResponseBuilder createdAt(LocalDateTime dt) { res.createdAt = dt; return this; }
        public CommentResponseBuilder userName(String name) { res.userName = name; return this; }
        public CommentResponseBuilder userId(Long id) { res.userId = id; return this; }
        public CommentResponse build() { return res; }
    }
}
