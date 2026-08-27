package com.civic.issue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

/**
 * Labeled training data — captures every time an admin overrides the
 * AI's suggested category. This table IS the dataset you would export
 * to fine-tune a dedicated classifier once you have enough volume
 * (hundreds of corrections). Mentioning this in an interview shows you
 * understand the full ML lifecycle: collect → label → retrain → redeploy,
 * not just "call an API and hope".
 */
@Entity
@Table(name = "category_feedback")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    private Issue issue;

    @Column(name = "ai_suggested", nullable = false)
    private String aiSuggested;

    @Column(name = "ai_confidence")
    private Integer aiConfidence;

    @Column(name = "admin_corrected", nullable = false)
    private String adminCorrected;

    @Column(name = "description_snapshot", columnDefinition = "TEXT")
    private String descriptionSnapshot;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
