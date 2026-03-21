package com.civic.issue.service;

import com.civic.issue.dto.response.ZonePerformanceResponse;
import com.civic.issue.dto.response.ZonePerformanceResponse.*;
import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ZonePerformanceService {

    private final IssueRepository issueRepository;
    private final UserRepository  userRepository;

    private static final int SLA_DAYS = 7;

    public ZonePerformanceResponse getZonePerformance() {
        List<Issue> allIssues = issueRepository.findAllByOrderByCreatedAtDesc();
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime now = LocalDateTime.now();

        // ── Zone stats ─────────────────────────────────────────────────────────
        List<ZoneStat> zoneStats = Arrays.stream(Zone.values())
                .filter(z -> z != Zone.UNASSIGNED)
                .map(zone -> buildZoneStat(zone, allIssues, monthStart, now))
                .collect(Collectors.toList());

        // ── SLA breaches — issues open > 7 days ────────────────────────────────
        List<SlaBreachItem> breaches = allIssues.stream()
                .filter(i -> i.getStatus() != IssueStatus.CLOSED)
                .filter(i -> i.getCreatedAt() != null)
                .filter(i -> ChronoUnit.DAYS.between(i.getCreatedAt(), now) > SLA_DAYS)
                .sorted(Comparator.comparingLong(
                        i -> -ChronoUnit.DAYS.between(i.getCreatedAt(), now)))
                .map(i -> SlaBreachItem.builder()
                        .issueId(i.getId())
                        .title(i.getTitle())
                        .zone(i.getZone() != null ? i.getZone().name() : "UNASSIGNED")
                        .category(i.getCategory())
                        .daysPending(ChronoUnit.DAYS.between(i.getCreatedAt(), now))
                        .status(i.getStatus().name())
                        .build())
                .collect(Collectors.toList());

        // ── Overall totals ─────────────────────────────────────────────────────
        int totalOpen  = (int) allIssues.stream()
                .filter(i -> i.getStatus() != IssueStatus.CLOSED).count();
        int resolvedM  = (int) allIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.CLOSED)
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isAfter(monthStart))
                .count();

        OptionalDouble avgAll = allIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.CLOSED && i.getCreatedAt() != null)
                .mapToLong(i -> ChronoUnit.DAYS.between(i.getCreatedAt(), now))
                .average();

        OverallTotals totals = OverallTotals.builder()
                .total(allIssues.size())
                .open(totalOpen)
                .resolvedMonth(resolvedM)
                .avgResolutionDays(avgAll.isPresent()
                        ? Math.round(avgAll.getAsDouble() * 10.0) / 10.0
                        : null)
                .build();

        // ── Top categories ─────────────────────────────────────────────────────
        Map<String, Long> catCounts = allIssues.stream()
                .filter(i -> i.getCategory() != null)
                .collect(Collectors.groupingBy(Issue::getCategory, Collectors.counting()));

        List<CategoryCount> topCategories = catCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(8)
                .map(e -> CategoryCount.builder()
                        .category(e.getKey())
                        .count(e.getValue().intValue())
                        .build())
                .collect(Collectors.toList());

        return ZonePerformanceResponse.builder()
                .zones(zoneStats)
                .slaBreaches(breaches)
                .totals(totals)
                .topCategories(topCategories)
                .build();
    }

    private ZoneStat buildZoneStat(Zone zone, List<Issue> allIssues,
                                    LocalDateTime monthStart, LocalDateTime now) {
        List<Issue> zoneIssues = allIssues.stream()
                .filter(i -> zone == i.getZone())
                .collect(Collectors.toList());

        // Find zone admin
        Optional<User> admin = userRepository.findByRoleAndZone(RoleType.REGIONAL_ADMIN, zone);

        int pending    = (int) zoneIssues.stream().filter(i -> i.getStatus() == IssueStatus.PENDING).count();
        int inProgress = (int) zoneIssues.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
        int resolved   = (int) zoneIssues.stream().filter(i -> i.getStatus() == IssueStatus.RESOLVED).count();
        int closed     = (int) zoneIssues.stream().filter(i -> i.getStatus() == IssueStatus.CLOSED).count();
        int open       = pending + inProgress + resolved;
        int resolvedM  = (int) zoneIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.CLOSED)
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isAfter(monthStart))
                .count();

        OptionalDouble avg = zoneIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.CLOSED && i.getCreatedAt() != null)
                .mapToLong(i -> ChronoUnit.DAYS.between(i.getCreatedAt(), now))
                .average();

        return ZoneStat.builder()
                .zone(zone.name())
                .adminName(admin.map(User::getName).orElse(null))
                .total(zoneIssues.size())
                .open(open)
                .pending(pending)
                .inProgress(inProgress)
                .resolved(resolved)
                .closed(closed)
                .resolvedMonth(resolvedM)
                .avgResolutionDays(avg.isPresent()
                        ? Math.round(avg.getAsDouble() * 10.0) / 10.0
                        : null)
                .build();
    }
}
