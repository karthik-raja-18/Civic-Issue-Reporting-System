package com.civic.issue.service;

import com.civic.issue.dto.AnalyticsDTO;
import com.civic.issue.entity.Issue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Loosely coupled analytics service.
 * Converts Issue → AnalyticsDTO and pushes data to the external Node.js analytics API.
 * All failures are caught silently so that they never interrupt main application flow.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsSyncService {

    private static final String ANALYTICS_API_URL = "https://complaint-analytics-dashboard.onrender.com/api/sync";
//   final String ANALYTICS_API_URL = "http://localhost:5000/api/sync";

    private final RestTemplate restTemplate;

    // ─── BATCH SYNC ───────────────────────────────────────────────────────────

    /**
     * Sends a filtered batch of resolved issues to the analytics API.
     * Only issues with a non-null resolvedAt are included.
     *
     * @param issues full list of issues (e.g. fetched from DB)
     */
    public void syncIssues(List<Issue> issues) {
        List<AnalyticsDTO> payload = issues.stream()
                .map(this::toDto)
                .toList();

        if (payload.isEmpty()) {
            log.info("[Analytics] No resolved issues to sync.");
            return;
        }

        try {
            restTemplate.postForEntity(ANALYTICS_API_URL, payload, Void.class);
            log.info("[Analytics] Batch sync succeeded — {} issues sent.", payload.size());
        } catch (Exception ex) {
            log.warn("[Analytics] Batch sync failed (analytics server may be down): {}", ex.getMessage());
        }
    }

    // ─── SINGLE SYNC (real-time) ──────────────────────────────────────────────

    /**
     * Sends a single resolved issue to the analytics API in real-time.
     * Fails silently if the analytics server is unavailable.
     *
     * @param issue the resolved issue to sync
     */
    public void syncSingleIssue(Issue issue) {
        try {
            AnalyticsDTO dto = toDto(issue);
            // Array requirement check: wrap in List
            List<AnalyticsDTO> payload = List.of(dto);
            restTemplate.postForEntity(ANALYTICS_API_URL, payload, Void.class);
            log.info("[Analytics] Single sync succeeded for issue #{}.", issue.getId());
        } catch (Exception ex) {
            log.warn("[Analytics] Single sync failed for issue #{} (analytics server may be down): {}",
                    issue.getId(), ex.getMessage());
        }
    }

    // ─── MAPPING ──────────────────────────────────────────────────────────────

    private AnalyticsDTO toDto(Issue issue) {
        return AnalyticsDTO.builder()
                .id(issue.getId())
                .department(issue.getCategory())   // category doubles as "department" for analytics
                .status(issue.getStatus() != null ? issue.getStatus().name() : null)
                .createdAt(issue.getCreatedAt())
                .resolvedAt(issue.getResolvedAt())
                .build();
    }
}
