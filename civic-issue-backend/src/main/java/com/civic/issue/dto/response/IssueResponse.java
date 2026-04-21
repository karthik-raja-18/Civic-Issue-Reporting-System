package com.civic.issue.dto.response;

import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.Zone;
import java.time.LocalDateTime;
import java.util.List;

public class IssueResponse {

    private Long          id;
    private String        title;
    private String        description;
    private String        category;
    private IssueStatus   status;
    private String        imageUrl;
    private String        resolvedImageUrl;
    private String        reopenNote;
    private Double        latitude;
    private Double        longitude;
    private Zone          zone;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt; // ✅ Added
    private LocalDateTime closedAt;   // ✅ Added
    private UserSummary   createdBy;
    private UserSummary   assignedTo;
    private List<CommentResponse> comments;
    private Integer upvoteCount;
    private Double  priorityScore;
    private Boolean hasUpvoted;

    public IssueResponse() {}

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public IssueStatus getStatus() { return status; }
    public String getImageUrl() { return imageUrl; }
    public String getResolvedImageUrl() { return resolvedImageUrl; }
    public String getReopenNote() { return reopenNote; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Zone getZone() { return zone; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public UserSummary getCreatedBy() { return createdBy; }
    public UserSummary getAssignedTo() { return assignedTo; }
    public List<CommentResponse> getComments() { return comments; }
    public Integer getUpvoteCount() { return upvoteCount; }
    public Double getPriorityScore() { return priorityScore; }
    public Boolean getHasUpvoted() { return hasUpvoted; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setCategory(String category) { this.category = category; }
    public void setStatus(IssueStatus status) { this.status = status; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setResolvedImageUrl(String resolvedImageUrl) { this.resolvedImageUrl = resolvedImageUrl; }
    public void setReopenNote(String reopenNote) { this.reopenNote = reopenNote; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public void setZone(Zone zone) { this.zone = zone; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public void setCreatedBy(UserSummary createdBy) { this.createdBy = createdBy; }
    public void setAssignedTo(UserSummary assignedTo) { this.assignedTo = assignedTo; }
    public void setComments(List<CommentResponse> comments) { this.comments = comments; }
    public void setUpvoteCount(Integer upvoteCount) { this.upvoteCount = upvoteCount; }
    public void setPriorityScore(Double priorityScore) { this.priorityScore = priorityScore; }
    public void setHasUpvoted(Boolean hasUpvoted) { this.hasUpvoted = hasUpvoted; }

    // Manual Builder
    public static IssueResponseBuilder builder() {
        return new IssueResponseBuilder();
    }

    public static class IssueResponseBuilder {
        private IssueResponse res = new IssueResponse();
        public IssueResponseBuilder id(Long id) { res.id = id; return this; }
        public IssueResponseBuilder title(String title) { res.title = title; return this; }
        public IssueResponseBuilder description(String description) { res.description = description; return this; }
        public IssueResponseBuilder category(String category) { res.category = category; return this; }
        public IssueResponseBuilder status(IssueStatus status) { res.status = status; return this; }
        public IssueResponseBuilder imageUrl(String imageUrl) { res.imageUrl = imageUrl; return this; }
        public IssueResponseBuilder resolvedImageUrl(String url) { res.resolvedImageUrl = url; return this; }
        public IssueResponseBuilder reopenNote(String note) { res.reopenNote = note; return this; }
        public IssueResponseBuilder latitude(Double latitude) { res.latitude = latitude; return this; }
        public IssueResponseBuilder longitude(Double longitude) { res.longitude = longitude; return this; }
        public IssueResponseBuilder zone(Zone zone) { res.zone = zone; return this; }
        public IssueResponseBuilder createdAt(LocalDateTime dt) { res.createdAt = dt; return this; }
        public IssueResponseBuilder resolvedAt(LocalDateTime dt) { res.resolvedAt = dt; return this; }
        public IssueResponseBuilder closedAt(LocalDateTime dt) { res.closedAt = dt; return this; }
        public IssueResponseBuilder createdBy(UserSummary user) { res.createdBy = user; return this; }
        public IssueResponseBuilder assignedTo(UserSummary user) { res.assignedTo = user; return this; }
        public IssueResponseBuilder comments(List<CommentResponse> comments) { res.comments = comments; return this; }
        public IssueResponseBuilder upvoteCount(Integer count) { res.upvoteCount = count; return this; }
        public IssueResponseBuilder priorityScore(Double score) { res.priorityScore = score; return this; }
        public IssueResponseBuilder hasUpvoted(Boolean has) { res.hasUpvoted = has; return this; }
        public IssueResponse build() { return res; }
    }

    public static class UserSummary {
        private Long   id;
        private String name;
        private String email;

        public UserSummary() {}
        public UserSummary(Long id, String name, String email) { this.id = id; this.name = name; this.email = email; }
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public static UserSummaryBuilder builder() { return new UserSummaryBuilder(); }

        public static class UserSummaryBuilder {
            private UserSummary res = new UserSummary();
            public UserSummaryBuilder id(Long id) { res.id = id; return this; }
            public UserSummaryBuilder name(String name) { res.name = name; return this; }
            public UserSummaryBuilder email(String email) { res.email = email; return this; }
            public UserSummary build() { return res; }
        }
    }
}
