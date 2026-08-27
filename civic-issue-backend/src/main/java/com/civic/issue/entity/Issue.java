package com.civic.issue.entity;

import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.Zone;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "issues")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
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
    @Builder.Default
    private IssueStatus status = IssueStatus.PENDING;

    private String imageUrl;

    @Column(name = "resolved_image_url")
    private String resolvedImageUrl;

    @Column(name = "reopen_note", columnDefinition = "TEXT")
    private String reopenNote;

    private Double latitude;
    private Double longitude;

    @Column(name = "upvote_count")
    @Builder.Default
    private Integer upvoteCount = 0;

    @Column(name = "priority_score")
    @Builder.Default
    private Double priorityScore = 0.0;

    // ── RAG / Semantic search (fix10) ──────────────────────────────────────────
    // 768-dim embedding vector from Gemini text-embedding-004, stored as a
    // JSON array string. LONGTEXT because the serialized array (~768 floats
    // as JSON) is larger than a normal TEXT column comfortably allows.
    @Column(name = "embedding", columnDefinition = "LONGTEXT")
    private String embedding;

    @Column(name = "embedding_updated_at")
    private LocalDateTime embeddingUpdatedAt;

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
    @Builder.Default
    private Zone zone = Zone.UNASSIGNED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IssueUpvote> upvotes = new ArrayList<>();
}
