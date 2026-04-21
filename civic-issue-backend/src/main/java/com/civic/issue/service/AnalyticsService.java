package com.civic.issue.service;

import com.civic.issue.dto.AnalyticsResponse;
import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public AnalyticsService(IssueRepository issueRepository, UserRepository userRepository) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    public AnalyticsResponse getAdminAnalytics() {
        List<Issue> issues = issueRepository.findAll();
        return computeAnalytics(issues);
    }

    public AnalyticsResponse getRegionalAnalytics(Zone zone) {
        List<Issue> issues = issueRepository.findByZoneOrderByCreatedAtDesc(zone);
        return computeAnalytics(issues);
    }

    private AnalyticsResponse computeAnalytics(List<Issue> issues) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime firstDayOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0);

        // Core KPIs
        long total       = issues.size();
        long closed      = issues.stream().filter(i -> i.getStatus() == IssueStatus.CLOSED).count();
        long open        = total - closed;
        long thisMonth   = issues.stream().filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isAfter(firstDayOfMonth)).count();
        
        // SLA Breach: Either currently open and >3 days old, OR resolved/closed after >3 days
        long slaBreaches = issues.stream()
                .filter(i -> {
                    if (i.getCreatedAt() == null) return false;
                    LocalDateTime completionTime = (i.getResolvedAt() != null) ? i.getResolvedAt() : (i.getClosedAt() != null ? i.getClosedAt() : now);
                    return Duration.between(i.getCreatedAt(), completionTime).toDays() >= 3;
                })
                .count();

        // Avg Resolution Days (for both RESOLVED and CLOSED issues)
        double avgDays = issues.stream()
                .filter(i -> (i.getStatus() == IssueStatus.CLOSED || i.getStatus() == IssueStatus.RESOLVED) && i.getCreatedAt() != null)
                .mapToLong(i -> {
                    LocalDateTime end = i.getResolvedAt() != null ? i.getResolvedAt() : (i.getClosedAt() != null ? i.getClosedAt() : now);
                    return Duration.between(i.getCreatedAt(), end).toDays();
                })
                .average()
                .orElse(0.0);

        return new AnalyticsResponse(
                total, open, closed, Math.round(avgDays * 10.0) / 10.0,
                slaBreaches, thisMonth,
                computeDailyTrends(issues),
                computeStatusBreakdown(issues),
                computeZoneStats(issues),
                computeTopCategories(issues),
                computeMonthlyTrends(issues)
        );
    }

    private List<AnalyticsResponse.DailyTrend> computeDailyTrends(List<Issue> issues) {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd");
        Map<String, AnalyticsResponse.DailyTrend> trendMap = new LinkedHashMap<>();
        
        // Last 14 days
        for (int i = 13; i >= 0; i--) {
            String dateStr = LocalDateTime.now().minusDays(i).format(dtf);
            trendMap.put(dateStr, new AnalyticsResponse.DailyTrend(dateStr, 0, 0));
        }

        for (Issue issue : issues) {
            if (issue.getCreatedAt() == null) continue;
            String createdDate = issue.getCreatedAt().format(dtf);
            if (trendMap.containsKey(createdDate)) {
                trendMap.get(createdDate).setSubmitted(trendMap.get(createdDate).getSubmitted() + 1);
            }
            // Count both RESOLVED and CLOSED as "Resolved Action"
            if ((issue.getStatus() == IssueStatus.RESOLVED || issue.getStatus() == IssueStatus.CLOSED)) {
                LocalDateTime resolvedTime = issue.getClosedAt() != null ? issue.getClosedAt() : issue.getResolvedAt();
                if (resolvedTime != null) {
                   String resolvedDate = resolvedTime.format(dtf);
                   if (trendMap.containsKey(resolvedDate)) {
                       trendMap.get(resolvedDate).setResolved(trendMap.get(resolvedDate).getResolved() + 1);
                   }
                }
            }
        }
        return new ArrayList<>(trendMap.values());
    }

    private List<AnalyticsResponse.StatusCount> computeStatusBreakdown(List<Issue> issues) {
        Map<IssueStatus, Long> counts = issues.stream()
                .collect(Collectors.groupingBy(Issue::getStatus, Collectors.counting()));
        
        return Arrays.stream(IssueStatus.values())
                .map(s -> new AnalyticsResponse.StatusCount(s.name(), counts.getOrDefault(s, 0L)))
                .collect(Collectors.toList());
    }

    private List<AnalyticsResponse.ZoneStat> computeZoneStats(List<Issue> issues) {
        List<AnalyticsResponse.ZoneStat> stats = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Zone zone : Zone.values()) {
            if (zone == Zone.UNASSIGNED) continue;
            List<Issue> zoneIssues = issues.stream().filter(i -> i.getZone() == zone).collect(Collectors.toList());
            
            long total = zoneIssues.size();
            long closed = zoneIssues.stream().filter(i -> i.getStatus() == IssueStatus.CLOSED).count();
            long open = total - closed;
            long breaches = zoneIssues.stream()
                    .filter(i -> {
                        if (i.getCreatedAt() == null) return false;
                        LocalDateTime completionTime = (i.getResolvedAt() != null) ? i.getResolvedAt() : (i.getClosedAt() != null ? i.getClosedAt() : now);
                        return Duration.between(i.getCreatedAt(), completionTime).toDays() >= 3;
                    })
                    .count();
            
            double avg = zoneIssues.stream()
                    .filter(i -> (i.getStatus() == IssueStatus.CLOSED || i.getStatus() == IssueStatus.RESOLVED) && i.getCreatedAt() != null)
                    .mapToLong(i -> {
                        LocalDateTime end = i.getResolvedAt() != null ? i.getResolvedAt() : (i.getClosedAt() != null ? i.getClosedAt() : now);
                        return Duration.between(i.getCreatedAt(), end).toDays();
                    })
                    .average().orElse(0.0);

            // Find Admin Name
            String adminName = userRepository.findByRoleAndZone(RoleType.REGIONAL_ADMIN, zone)
                    .map(User::getName)
                    .orElse("NOT ASSIGNED");

            stats.add(new AnalyticsResponse.ZoneStat(
                zone.name(), adminName, total, open, closed, Math.round(avg * 10.0) / 10.0, breaches
            ));
        }
        return stats;
    }

    private List<AnalyticsResponse.CategoryStat> computeTopCategories(List<Issue> issues) {
        return issues.stream()
                .filter(i -> i.getCategory() != null)
                .collect(Collectors.groupingBy(Issue::getCategory, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(e -> new AnalyticsResponse.CategoryStat(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private List<AnalyticsResponse.MonthlyTrend> computeMonthlyTrends(List<Issue> issues) {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM");
        Map<String, AnalyticsResponse.MonthlyTrend> trendMap = new LinkedHashMap<>();

        // Last 6 months
        for (int i = 5; i >= 0; i--) {
            String month = LocalDateTime.now().minusMonths(i).format(dtf);
            trendMap.put(month, new AnalyticsResponse.MonthlyTrend(month, 0, 0));
        }

        for (Issue issue : issues) {
            if (issue.getCreatedAt() == null) continue;
            String createdMonth = issue.getCreatedAt().format(dtf);
            if (trendMap.containsKey(createdMonth)) {
                trendMap.get(createdMonth).setSubmitted(trendMap.get(createdMonth).getSubmitted() + 1);
            }
            
            if (issue.getStatus() == IssueStatus.RESOLVED || issue.getStatus() == IssueStatus.CLOSED) {
                LocalDateTime resolvedTime = issue.getClosedAt() != null ? issue.getClosedAt() : issue.getResolvedAt();
                if (resolvedTime != null) {
                    String resolvedMonth = resolvedTime.format(dtf);
                    if (trendMap.containsKey(resolvedMonth)) {
                        trendMap.get(resolvedMonth).setResolved(trendMap.get(resolvedMonth).getResolved() + 1);
                    }
                }
            }
        }
        return new ArrayList<>(trendMap.values());
    }
}
