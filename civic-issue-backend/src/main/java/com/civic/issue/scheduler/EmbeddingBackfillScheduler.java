package com.civic.issue.scheduler;

import com.civic.issue.entity.Issue;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.service.EmbeddingService;
import com.civic.issue.util.VectorMathUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Backfills embeddings for issues that don't have one yet — either because
 * they were created before this feature existed, or because embedding
 * generation failed at creation time (Gemini quota / network issue).
 *
 * Runs every 10 minutes and processes a small batch (rate-limit friendly —
 * Gemini's free embedding tier shares the same daily quota family as the
 * Flash model, so we don't want to burn it all in one run).
 *
 * Enable scheduling in your main class with @EnableScheduling (already
 * added for the SLA scheduler in an earlier feature — reused here).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmbeddingBackfillScheduler {

    private final IssueRepository  issueRepository;
    private final EmbeddingService embeddingService;

    private static final int BATCH_SIZE = 20;

    @Scheduled(fixedDelay = 10 * 60 * 1000) // every 10 minutes
    @Transactional
    public void backfillMissingEmbeddings() {
        List<Issue> missing = issueRepository.findTopNByEmbeddingIsNull(BATCH_SIZE);

        if (missing.isEmpty()) {
            log.debug("Embedding backfill: nothing to do");
            return;
        }

        log.info("Embedding backfill: processing {} issues", missing.size());

        int success = 0;
        for (Issue issue : missing) {
            String textToEmbed = buildEmbeddingText(issue);
            float[] embedding = embeddingService.embed(textToEmbed);

            if (embedding != null) {
                issue.setEmbedding(VectorMathUtil.toJson(embedding));
                issue.setEmbeddingUpdatedAt(LocalDateTime.now());
                issueRepository.save(issue);
                success++;
            } else {
                // Leave it null — will be retried next run. If Gemini is
                // down for an extended period this just means semantic
                // features degrade gracefully rather than blocking anything.
                log.warn("Failed to embed issue #{} — will retry next cycle", issue.getId());
            }
        }

        log.info("Embedding backfill: {}/{} succeeded", success, missing.size());
    }

    /** Combine title + description + category for a richer embedding than
     *  description alone — gives the vector more semantic signal. */
    private String buildEmbeddingText(Issue issue) {
        return String.format("%s. %s. Category: %s",
                issue.getTitle() != null ? issue.getTitle() : "",
                issue.getDescription() != null ? issue.getDescription() : "",
                issue.getCategory() != null ? issue.getCategory() : "");
    }
}
