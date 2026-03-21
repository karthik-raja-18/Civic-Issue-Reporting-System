package com.civic.issue.component;

import com.civic.issue.entity.Issue;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.service.AnalyticsSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Enhanced startup sync component.
 * Uses @EventListener(ApplicationReadyEvent.class) as requested to automatically
 * push all existing database records to the Node.js dashboard when the server starts.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnalyticsStartupSync {

    private final IssueRepository issueRepository;
    private final AnalyticsSyncService analyticsSyncService;

    /**
     * Triggered when the application is fully ready.
     * Pushes all existing complaint data to the external analytics service.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("[Analytics] Application Ready — initiating full data sync to Node.js...");

        try {
            // Fetch all issues (matching 'push all existing records from your database')
            List<Issue> allIssues = issueRepository.findAll();
            
            // Sync to the Node.js API
            analyticsSyncService.syncIssues(allIssues);
            
            log.info("[Analytics] Full startup sync successful ({} total records).", allIssues.size());
        } catch (Exception ex) {
            log.error("[Analytics] Full startup sync failed: {}", ex.getMessage());
        }
    }
}
