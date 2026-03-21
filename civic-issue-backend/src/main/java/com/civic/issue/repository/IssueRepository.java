package com.civic.issue.repository;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.enums.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    List<Issue> findAllByOrderByCreatedAtDesc();

    List<Issue> findByCreatedByOrderByCreatedAtDesc(User user);

    List<Issue> findByZoneOrderByCreatedAtDesc(Zone zone);

    List<Issue> findByAssignedToOrderByCreatedAtDesc(User user);

    List<Issue> findByAssignedToIsNull();

    @Query("SELECT COUNT(i) FROM Issue i WHERE i.assignedTo = :user AND i.status NOT IN ('CLOSED')")
    long countActiveByAssignedTo(@Param("user") User user);

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
}