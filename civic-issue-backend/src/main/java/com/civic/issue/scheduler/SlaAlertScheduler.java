package com.civic.issue.scheduler;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.Notification;
import com.civic.issue.entity.User;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.RoleType;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.NotificationRepository;
import com.civic.issue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Runs every day at 8:00 AM IST.
 * Finds issues open > 7 days and sends SLA breach notifications to:
 *  1. The assigned zone admin
 *  2. The super admin
 *
 * Enable scheduling in your main class:
 *   @SpringBootApplication
 *   @EnableScheduling   ← add this
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SlaAlertScheduler {

    private final IssueRepository        issueRepository;
    private final UserRepository         userRepository;
    private final NotificationRepository notificationRepository;

    private static final int SLA_DAYS = 7;

    /**
     * Runs every day at 08:00 AM IST (UTC+5:30 = 02:30 UTC)
     * cron format: second minute hour day month weekday
     */
    @Scheduled(cron = "0 30 2 * * *")  // 08:00 IST daily
    public void checkSlaBreaches() {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime threshold = now.minusDays(SLA_DAYS);

        List<Issue> breachedIssues = issueRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(i -> i.getStatus() != IssueStatus.CLOSED)
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isBefore(threshold))
                .toList();

        if (breachedIssues.isEmpty()) {
            log.info("SLA Scheduler: No breaches found today ✅");
            return;
        }

        log.warn("SLA Scheduler: {} issues have breached 7-day SLA", breachedIssues.size());

        // Notify super admins
        List<User> superAdmins = userRepository.findByRole(RoleType.ADMIN);

        for (Issue issue : breachedIssues) {
            long daysPending = ChronoUnit.DAYS.between(issue.getCreatedAt(), now);

            String message = String.format(
                    "⚠️ SLA Breach: Issue #%d '%s' in %s zone has been open for %d days (SLA: %d days). Immediate action required.",
                    issue.getId(), issue.getTitle(),
                    issue.getZone() != null ? issue.getZone().name() : "UNASSIGNED",
                    daysPending, SLA_DAYS
            );

            // Notify assigned zone user or regional admin
            if (issue.getAssignedTo() != null) {
                saveNotification(issue.getAssignedTo(), message);
            } else if (issue.getZone() != null && issue.getZone() != com.civic.issue.enums.Zone.UNASSIGNED) {
                userRepository.findByRoleAndZone(RoleType.REGIONAL_ADMIN, issue.getZone())
                        .ifPresent(admin -> saveNotification(admin, message));
            }

            // Notify all super admins
            for (User admin : superAdmins) {
                saveNotification(admin, message);
            }

            log.warn("SLA breach alert sent for Issue #{} — {} days pending", issue.getId(), daysPending);
        }

        log.info("SLA Scheduler: Sent breach alerts for {} issues", breachedIssues.size());
    }

    private void saveNotification(User user, String message) {
        notificationRepository.save(
                Notification.builder()
                        .message(message)
                        .user(user)
                        .build()
        );
    }
}
