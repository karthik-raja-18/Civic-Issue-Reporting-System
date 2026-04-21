package com.civic.issue.service;

import com.civic.issue.entity.Issue;
import com.civic.issue.enums.IssueStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Calculates a priority score (0–100) for each issue.
 * Higher score = shown first in admin queue.
 *
 * Formula:
 *   Base:       20 points
 *   Upvotes:    up to 30 points (3 points per upvote, max 10 upvotes)
 *   Age:        up to 30 points (older issues get higher score)
 *   Status:     REOPENED +20, IN_PROGRESS +5, PENDING +10
 *   Category:   safety-critical categories +10
 */
@Service
public class PriorityScoreService {

    private static final int    MAX_UPVOTE_SCORE = 30;
    private static final int    MAX_AGE_SCORE    = 30;
    private static final int    POINTS_PER_UPVOTE = 3;
    private static final int    MAX_UPVOTES       = 10;
    private static final int    MAX_AGE_DAYS      = 14;

    private static final java.util.Set<String> CRITICAL_CATEGORIES =
            java.util.Set.of("Pothole", "Waterlogging", "Sewage",
                             "Drainage", "Fallen Tree", "Water Leakage");

    public double calculate(Issue issue) {
        double score = 20.0; // base

        // ── Upvotes ───────────────────────────────────────────────────────────
        int upvotes = issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0;
        double upvoteScore = Math.min(upvotes * POINTS_PER_UPVOTE, MAX_UPVOTE_SCORE);
        score += upvoteScore;

        // ── Age of issue ─────────────────────────────────────────────────────
        if (issue.getCreatedAt() != null) {
            long days = ChronoUnit.DAYS.between(issue.getCreatedAt(), LocalDateTime.now());
            double ageScore = Math.min(
                    (double) days / MAX_AGE_DAYS * MAX_AGE_SCORE,
                    MAX_AGE_SCORE);
            score += ageScore;
        }

        // ── Status bonus ─────────────────────────────────────────────────────
        if (issue.getStatus() == IssueStatus.REOPENED)    score += 20;
        else if (issue.getStatus() == IssueStatus.PENDING)    score += 10;
        else if (issue.getStatus() == IssueStatus.IN_PROGRESS) score += 5;

        // ── Category bonus ───────────────────────────────────────────────────
        if (issue.getCategory() != null
                && CRITICAL_CATEGORIES.contains(issue.getCategory())) {
            score += 10;
        }

        return Math.min(score, 100.0); // cap at 100
    }
}
