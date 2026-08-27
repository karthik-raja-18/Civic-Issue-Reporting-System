package com.civic.issue.repository;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.Zone;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    // ── Core queries ──────────────────────────────────────────────────────────
    @Query("SELECT i FROM Issue i ORDER BY i.priorityScore DESC, i.createdAt DESC")
    List<Issue> findAllByOrderByPriorityScoreDesc();

    List<Issue> findAllByOrderByCreatedAtDesc();

    List<Issue> findByCreatedByOrderByCreatedAtDesc(User user);

    List<Issue> findByZoneOrderByCreatedAtDesc(Zone zone);

    List<Issue> findByAssignedToOrderByCreatedAtDesc(User user);

    List<Issue> findByAssignedToIsNull();

    Optional<Issue> findTopByCreatedByAndStatusOrderByCreatedAtDesc(
            User createdBy, IssueStatus status);

    @Query("SELECT COUNT(i) FROM Issue i WHERE i.assignedTo = :user AND i.status NOT IN ('CLOSED')")
    long countActiveByAssignedTo(@Param("user") User user);

    // ── Duplicate detection (Haversine fast path, fix5) ─────────────────────────
    @Query("""
        SELECT i FROM Issue i
        WHERE i.category = :category
          AND i.latitude  BETWEEN :latMin AND :latMax
          AND i.longitude BETWEEN :lngMin AND :lngMax
          AND i.createdAt >= :since
          AND i.status <> 'CLOSED'
        ORDER BY i.createdAt DESC
        """)
    List<Issue> findCandidateDuplicates(
            @Param("category")  String category,
            @Param("latMin")    Double latMin,
            @Param("latMax")    Double latMax,
            @Param("lngMin")    Double lngMin,
            @Param("lngMax")    Double lngMax,
            @Param("since")     LocalDateTime since
    );

    // ── Semantic duplicate detection (fix10) — NO category filter, wider net,
    //    embedding similarity does the precision work in the service layer ──
    @Query("""
        SELECT i FROM Issue i
        WHERE i.latitude  BETWEEN :latMin AND :latMax
          AND i.longitude BETWEEN :lngMin AND :lngMax
          AND i.createdAt >= :since
          AND i.status <> 'CLOSED'
          AND i.embedding IS NOT NULL
        ORDER BY i.createdAt DESC
        """)
    List<Issue> findOpenCandidatesNearLocation(
            @Param("latMin") Double latMin,
            @Param("latMax") Double latMax,
            @Param("lngMin") Double lngMin,
            @Param("lngMax") Double lngMax,
            @Param("since")  LocalDateTime since
    );

    // ── RAG retrieval (fix10) ────────────────────────────────────────────────
    // Pulls all CLOSED issues that have an embedding, for the chat assistant
    // to brute-force cosine-similarity search over. Fine at this scale;
    // swap for pgvector/FAISS once the table grows large.
    List<Issue> findAllByStatusAndEmbeddingIsNotNull(IssueStatus status);

    List<Issue> findAllByEmbeddingIsNotNull();

    // ── Embedding backfill scheduler (fix10) ────────────────────────────────
    @Query(value = "SELECT * FROM issues WHERE embedding IS NULL ORDER BY id ASC LIMIT :limit",
           nativeQuery = true)
    List<Issue> findTopNByEmbeddingIsNull(@Param("limit") int limit);
}
