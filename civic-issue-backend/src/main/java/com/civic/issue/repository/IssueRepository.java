package com.civic.issue.repository;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.enums.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    List<Issue> findAllByOrderByCreatedAtDesc();

    List<Issue> findByCreatedByOrderByCreatedAtDesc(User user);

    // ✅ NEW — find issues by zone (for regional admin)
    List<Issue> findByZoneOrderByCreatedAtDesc(Zone zone);

    // ✅ NEW — find issues assigned to a specific admin
    List<Issue> findByAssignedTo(User admin);

    // ✅ NEW — find unassigned issues (no regional admin)
    List<Issue> findByAssignedToIsNull();

    // ✅ NEW — count issues by user
    long countByCreatedBy(User user);
}
