package com.civic.issue.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "issue_upvotes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"issue_id","user_id"}))
public class IssueUpvote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public IssueUpvote() {}

    public IssueUpvote(Issue issue, User user) {
        this.issue = issue;
        this.user = user;
    }

    // Manual Builder
    public static IssueUpvoteBuilder builder() {
        return new IssueUpvoteBuilder();
    }

    public static class IssueUpvoteBuilder {
        private IssueUpvote res = new IssueUpvote();
        public IssueUpvoteBuilder issue(Issue issue) { res.issue = issue; return this; }
        public IssueUpvoteBuilder user(User user) { res.user = user; return this; }
        public IssueUpvote build() { return res; }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Issue getIssue() { return issue; }
    public void setIssue(Issue issue) { this.issue = issue; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
