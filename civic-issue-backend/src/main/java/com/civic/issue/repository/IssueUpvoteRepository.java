package com.civic.issue.repository;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.IssueUpvote;
import com.civic.issue.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface IssueUpvoteRepository extends JpaRepository<IssueUpvote, Long> {

    boolean existsByIssueAndUser(Issue issue, User user);

    Optional<IssueUpvote> findByIssueAndUser(Issue issue, User user);

    int countByIssue(Issue issue);
}
