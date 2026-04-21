package com.civic.issue.entity;

import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.Zone;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "issues")
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IssueStatus status = IssueStatus.PENDING;

    private String imageUrl;

    @Column(name = "resolved_image_url")
    private String resolvedImageUrl;

    @Column(name = "reopen_note", columnDefinition = "TEXT")
    private String reopenNote;

    private Double latitude;
    private Double longitude;

    @Column(name = "upvote_count")
    private Integer upvoteCount = 0;

    @Column(name = "priority_score")
    private Double priorityScore = 0.0;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone", length = 20)
    private Zone zone = Zone.UNASSIGNED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<IssueUpvote> upvotes = new ArrayList<>();

    public Issue() {}

    public Issue(Long id, String title, String description, String category, IssueStatus status, String imageUrl, String resolvedImageUrl, String reopenNote, Double latitude, Double longitude, Integer upvoteCount, Double priorityScore, User createdBy, Zone zone) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.status = status;
        this.imageUrl = imageUrl;
        this.resolvedImageUrl = resolvedImageUrl;
        this.reopenNote = reopenNote;
        this.latitude = latitude;
        this.longitude = longitude;
        this.upvoteCount = upvoteCount;
        this.priorityScore = priorityScore;
        this.createdBy = createdBy;
        this.zone = zone;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getResolvedImageUrl() { return resolvedImageUrl; }
    public void setResolvedImageUrl(String resolvedImageUrl) { this.resolvedImageUrl = resolvedImageUrl; }
    public String getReopenNote() { return reopenNote; }
    public void setReopenNote(String reopenNote) { this.reopenNote = reopenNote; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Integer getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(Integer upvoteCount) { this.upvoteCount = upvoteCount; }
    public Double getPriorityScore() { return priorityScore; }
    public void setPriorityScore(Double priorityScore) { this.priorityScore = priorityScore; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public Zone getZone() { return zone; }
    public void setZone(Zone zone) { this.zone = zone; }
    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public List<Comment> getComments() { return comments; }
    public void setComments(List<Comment> comments) { this.comments = comments; }

    public static IssueBuilder builder() { return new IssueBuilder(); }

    public static class IssueBuilder {
        private Issue issue = new Issue();
        public IssueBuilder title(String title) { issue.title = title; return this; }
        public IssueBuilder description(String desc) { issue.description = desc; return this; }
        public IssueBuilder category(String cat) { issue.category = cat; return this; }
        public IssueBuilder imageUrl(String url) { issue.imageUrl = url; return this; }
        public IssueBuilder latitude(Double lat) { issue.latitude = lat; return this; }
        public IssueBuilder longitude(Double lon) { issue.longitude = lon; return this; }
        public IssueBuilder createdBy(User user) { issue.createdBy = user; return this; }
        public IssueBuilder zone(Zone zone) { issue.zone = zone; return this; }
        public IssueBuilder assignedTo(User admin) { issue.assignedTo = admin; return this; }
        public IssueBuilder upvoteCount(Integer count) { issue.upvoteCount = count; return this; }
        public IssueBuilder priorityScore(Double score) { issue.priorityScore = score; return this; }
        public Issue build() { return issue; }
    }
}
