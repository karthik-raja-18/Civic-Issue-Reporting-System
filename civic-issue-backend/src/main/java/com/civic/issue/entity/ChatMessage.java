package com.civic.issue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String role; // "USER" | "ASSISTANT"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // JSON array of issue IDs that were retrieved and used as RAG context
    // for this message — kept so you can show "sources" in the UI and
    // for debugging retrieval quality.
    @Column(name = "retrieved_issue_ids", columnDefinition = "TEXT")
    private String retrievedIssueIds;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
