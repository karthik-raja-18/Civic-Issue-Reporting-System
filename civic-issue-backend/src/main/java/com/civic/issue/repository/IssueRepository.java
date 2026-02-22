package com.civic.issue.repository;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findAllByOrderByCreatedAtDesc();
    List<Issue> findByCreatedByOrderByCreatedAtDesc(User user);
}
