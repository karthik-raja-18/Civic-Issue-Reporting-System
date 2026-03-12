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

    // Photo taken by reporter (before)
    private String imageUrl;
    @Column(name = "image_public_id")
    private String imagePublicId;

    // ✅ NEW — Photo uploaded by admin as proof of fix (after)
    @Column(name = "resolved_image_url")
    private String resolvedImageUrl;
    @Column(name = "resolved_image_public_id")
    private String resolvedImagePublicId;

    // ✅ NEW — Note from reporter when they reopen (optional)
    @Column(name = "reopen_note", columnDefinition = "TEXT")
    private String reopenNote;

    private Double latitude;
    private Double longitude;

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
}
