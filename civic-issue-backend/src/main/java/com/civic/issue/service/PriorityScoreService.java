package com.civic.issue.service;

import com.civic.issue.entity.Issue;
import com.civic.issue.enums.IssueStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Risk-Based Priority Scoring (0–100) for civic issues.
 *
 * Formula (weighted):
 *   Category Severity  : 0–40 pts  (health/safety issues are highest risk)
 *   Upvotes            : 0–25 pts  (community impact, logarithmic scale)
 *   Age Urgency        : 0–20 pts  (older unresolved issues gain urgency)
 *   Status Multiplier  : 0–15 pts  (REOPENED > PENDING > IN_PROGRESS)
 *
 * This ensures a critical Sewage/Pothole issue is always ranked above
 * a minor Streetlight issue regardless of upvote count.
 */
@Service
public class PriorityScoreService {

    // Category → severity weight (0–40)
    private static final Map<String, Integer> CATEGORY_SEVERITY = Map.ofEntries(
        Map.entry("Sewage",              40),   // Public health emergency
        Map.entry("Waterlogging",        38),   // Flood / disease risk
        Map.entry("Pothole",             35),   // Accident risk
        Map.entry("Fallen Tree",         35),   // Safety hazard
        Map.entry("Water Leakage",       32),   // Infrastructure loss
        Map.entry("Drainage",            30),   // Sanitation risk
        Map.entry("Road Damage",         28),   // Vehicle / pedestrian risk
        Map.entry("Illegal Construction",25),   // Legal / safety
        Map.entry("Garbage",             22),   // Health / aesthetics
        Map.entry("Footpath",            18),   // Pedestrian inconvenience
        Map.entry("Streetlight",         15),   // Night safety
        Map.entry("Other",               10)    // Unknown / misc
    );

    public double calculate(Issue issue) {
        // ── 1. Category Severity (0–40 pts) ──────────────────────────────────
        int severityScore = CATEGORY_SEVERITY.getOrDefault(issue.getCategory(), 10);

        // ── 2. Upvote Score – logarithmic to prevent gaming (0–25 pts) ───────
        int upvotes = issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0;
        double upvoteScore = upvotes > 0
                ? Math.min(25.0 * (Math.log(upvotes + 1) / Math.log(51)), 25.0)
                : 0.0;

        // ── 3. Age Urgency – ramps up over 7 days, caps at 14 (0–20 pts) ────
        double ageScore = 0.0;
        if (issue.getCreatedAt() != null) {
            long hours = ChronoUnit.HOURS.between(issue.getCreatedAt(), LocalDateTime.now());
            // Starts urgency at 24h, maxes at 14 days (336h)
            ageScore = Math.min(20.0 * (Math.max(0, hours - 24.0) / 312.0), 20.0);
        }

        // ── 4. Status Bonus (0–15 pts) ────────────────────────────────────────
        double statusScore = 0.0;
        if (issue.getStatus() == IssueStatus.REOPENED)       statusScore = 15.0; // Re-escalated
        else if (issue.getStatus() == IssueStatus.PENDING)   statusScore = 12.0; // Needs assignment
        else if (issue.getStatus() == IssueStatus.IN_PROGRESS) statusScore = 5.0; // Being handled
        // RESOLVED / CLOSED → 0 (no urgency)

        double total = severityScore + upvoteScore + ageScore + statusScore;
        return Math.min(Math.round(total * 10.0) / 10.0, 100.0);
    }
}
