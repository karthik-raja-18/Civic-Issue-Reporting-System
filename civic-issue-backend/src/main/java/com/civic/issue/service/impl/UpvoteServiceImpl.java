package com.civic.issue.service.impl;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.IssueUpvote;
import com.civic.issue.entity.User;
import com.civic.issue.exception.IssueRejectionException;
import com.civic.issue.exception.ResourceNotFoundException;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.IssueUpvoteRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.DuplicateDetectionService;
import com.civic.issue.service.PriorityScoreService;
import com.civic.issue.service.UpvoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class UpvoteServiceImpl implements UpvoteService {

    private static final Logger log = LoggerFactory.getLogger(UpvoteServiceImpl.class);

    private final IssueRepository      issueRepository;
    private final UserRepository       userRepository;
    private final IssueUpvoteRepository upvoteRepository;
    private final PriorityScoreService priorityScoreService;

    // Increased to 2km for user convenience
    private static final double MAX_UPVOTE_DISTANCE = 2000.0; 

    public UpvoteServiceImpl(
            IssueRepository issueRepository,
            UserRepository userRepository,
            IssueUpvoteRepository upvoteRepository,
            PriorityScoreService priorityScoreService) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.upvoteRepository = upvoteRepository;
        this.priorityScoreService = priorityScoreService;
    }

    @Override
    @Transactional
    public Map<String, Object> toggleUpvote(Long issueId, String userEmail, Double lat, Double lng) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", issueId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        // 1. Proximity check
        if (lat != null && lng != null && issue.getLatitude() != null && issue.getLongitude() != null) {
            double distance = DuplicateDetectionService.haversineMetres(
                    lat, lng, issue.getLatitude(), issue.getLongitude());
            
            if (distance > MAX_UPVOTE_DISTANCE) {
                throw new IssueRejectionException(
                        String.format("You must be within 2km to upvote. (Current distance: %.0fm)", distance));
            }
        }

        Optional<IssueUpvote> existing = upvoteRepository.findByIssueAndUser(issue, user);
        boolean hasUpvoted;

        if (existing.isPresent()) {
            upvoteRepository.delete(existing.get());
            issue.setUpvoteCount(Math.max(0, issue.getUpvoteCount() - 1));
            hasUpvoted = false;
        } else {
            // Using manual builder added to IssueUpvote entity
            upvoteRepository.save(IssueUpvote.builder().issue(issue).user(user).build());
            issue.setUpvoteCount((issue.getUpvoteCount() == null ? 0 : issue.getUpvoteCount()) + 1);
            hasUpvoted = true;
        }

        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue saved = issueRepository.save(issue);

        log.info("Issue #{} upvoted by {} -> Count: {}", issueId, userEmail, saved.getUpvoteCount());

        return Map.of(
            "upvoteCount", saved.getUpvoteCount(),
            "hasUpvoted", hasUpvoted,
            "priorityScore", saved.getPriorityScore()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUpvoted(Long issueId, String userEmail) {
        Issue issue = issueRepository.findById(issueId).orElse(null);
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (issue == null || user == null) return false;
        return upvoteRepository.findByIssueAndUser(issue, user).isPresent();
    }
}
