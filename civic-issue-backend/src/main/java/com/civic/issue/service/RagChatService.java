package com.civic.issue.service;

import com.civic.issue.entity.ChatMessage;
import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.repository.ChatMessageRepository;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.util.VectorMathUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * "Ask CivicPulse" — Retrieval-Augmented Generation chat assistant.
 *
 * WHY RAG INSTEAD OF JUST CALLING GEMINI DIRECTLY
 * ────────────────────────────────────────────────
 * If you just send a citizen's question straight to Gemini ("How long
 * does a pothole take to fix in RS Puram?"), the model has NO knowledge
 * of your actual database — it will either refuse to answer or, worse,
 * HALLUCINATE a plausible-sounding but completely made-up number.
 *
 * RAG fixes this by retrieving REAL, GROUNDED facts from your own data
 * before generation, then forcing the model to answer using only that
 * retrieved context. This is the same architectural pattern used by
 * production systems like ChatGPT's "Browse" mode, Perplexity, and
 * enterprise internal-knowledge chatbots — retrieve, then generate.
 *
 * THE PIPELINE
 * ────────────
 *  1. EMBED the citizen's question → 768-dim vector (RETRIEVAL_QUERY mode)
 *  2. SEARCH all CLOSED issues' pre-computed embeddings via cosine
 *     similarity — this is a brute-force vector search (fine at this
 *     scale; a real production system would use a proper ANN index like
 *     FAISS or pgvector once the dataset grows past ~100k rows)
 *  3. RETRIEVE the top-K most semantically similar past issues, including
 *     their actual resolution time, zone, and category
 *  4. AUGMENT the LLM prompt by injecting that retrieved data as context
 *  5. GENERATE an answer that is explicitly instructed to use ONLY the
 *     provided context, and to say "I don't have enough data" rather
 *     than guess if the context doesn't support an answer
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagChatService {

    private final EmbeddingService       embeddingService;
    private final IssueRepository        issueRepository;
    private final UserRepository         userRepository;
    private final ChatMessageRepository  chatMessageRepository;

    @Value("${gemini.api.key:NOTSET}")
    private String apiKey;

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=";

    private static final int TOP_K = 5;
    private static final double MIN_RELEVANCE = 0.68; // below this, treat as "no relevant data"

    /**
     * Main entry point — answers a citizen's question grounded in real
     * historical issue data.
     */
    @Transactional
    public ChatAnswer ask(String userEmail, String question) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        // ── Step 1: Save the user's message ─────────────────────────────────
        chatMessageRepository.save(ChatMessage.builder()
                .user(user).role("USER").content(question).build());

        // ── Step 2: Embed the question (RETRIEVAL_QUERY mode) ───────────────
        float[] questionEmbedding = embeddingService.embedQuery(question);

        if (questionEmbedding == null) {
            // Embeddings unavailable — fail gracefully with a direct
            // (ungrounded but honest) Gemini answer instead of crashing.
            String systemInstruction = "You are the CivicPulse Assistant for Coimbatore District. Treat this answer as general guidance only, as we do not have access to historical data right now.";
            String fallback = askGeminiDirect(systemInstruction, question);
            saveAssistantMessage(user, fallback, List.of());
            return new ChatAnswer(fallback, List.of(), false);
        }

        // ── Step 3: Retrieve top-K similar CLOSED issues ─────────────────────
        List<ScoredIssue> retrieved = retrieveSimilarIssues(questionEmbedding);

        if (retrieved.isEmpty()) {
            String systemInstruction = """
                You are the CivicPulse Assistant for Coimbatore District citizens.
                Answer the citizen's query politely.
                If they say hello or greet you, greet them back warmly.
                If they ask about general civic topics, answer using your general knowledge, but note that you don't have specific local data records for it.
                If they ask something completely unrelated, redirect them to civic topics.
                """;
            String answer = askGeminiDirect(systemInstruction, question);
            saveAssistantMessage(user, answer, List.of());
            return new ChatAnswer(answer, List.of(), false);
        }

        // ── Step 4 + 5: Build grounded prompt and generate ───────────────────
        String groundedAnswer = generateGroundedAnswer(question, retrieved);

        List<Long> sourceIds = retrieved.stream()
                .map(si -> si.issue.getId()).collect(Collectors.toList());

        saveAssistantMessage(user, groundedAnswer, sourceIds);

        return new ChatAnswer(groundedAnswer,
                retrieved.stream().map(this::toSourceSummary).toList(),
                true);
    }

    // ── Retrieval ────────────────────────────────────────────────────────────

    private List<ScoredIssue> retrieveSimilarIssues(float[] questionEmbedding) {
        // Brute-force scan of CLOSED issues with embeddings.
        // At this dataset scale (thousands, not millions, of rows) this is
        // fast enough to run synchronously per request. If this grows much
        // larger, swap for pgvector's <-> operator or a FAISS sidecar index.
        List<Issue> candidates = issueRepository.findAllByEmbeddingIsNotNull();

        List<ScoredIssue> scored = new ArrayList<>();
        for (Issue issue : candidates) {
            float[] issueEmbedding = VectorMathUtil.fromJson(issue.getEmbedding());
            if (issueEmbedding == null) continue;

            double similarity = VectorMathUtil.cosineSimilarity(questionEmbedding, issueEmbedding);
            if (similarity >= MIN_RELEVANCE) {
                scored.add(new ScoredIssue(issue, similarity));
            }
        }

        scored.sort((a, b) -> Double.compare(b.similarity, a.similarity));

        return scored.stream().limit(TOP_K).collect(Collectors.toList());
    }

    // ── Generation (augmented with retrieved context) ──────────────────────────

    private String generateGroundedAnswer(String question, List<ScoredIssue> retrieved) {
        StringBuilder context = new StringBuilder();
        for (ScoredIssue si : retrieved) {
            Issue i = si.issue;
            long resolutionDays = i.getCreatedAt() != null
                    ? ChronoUnit.DAYS.between(i.getCreatedAt(),
                        i.getCreatedAt().plusDays(estimateResolutionDays(i)))
                    : -1;

            context.append(String.format(
                "- Issue #%d [%.0f%% relevant]: \"%s\" — Category: %s, Zone: %s, " +
                "Status: %s, Resolution time: %d days\n",
                i.getId(), si.similarity * 100, truncate(i.getTitle(), 80),
                i.getCategory(), i.getZone() != null ? i.getZone().name() : "Unknown",
                i.getStatus() != null ? i.getStatus().name() : "Unknown",
                resolutionDays
            ));
        }

        String systemInstruction = """
            You are the CivicPulse Assistant for Coimbatore District citizens.
            You answer citizen questions grounded in real historical civic issue data.

            INSTRUCTIONS:
            - Answer using ONLY the provided data. Do not invent numbers or facts.
            - If the data only partially answers the question, say what you can and acknowledge what is missing.
            - Cite specific zones, categories, or timeframes from the data when relevant — be concrete, not vague.
            - Keep the answer conversational, helpful, and under 120 words.
            - Do not mention "the context" or "the data provided" explicitly — just answer naturally as if you know this from experience.
            - If asked something completely unrelated to civic issues, politely redirect to CivicPulse topics.
            """;

        String userContent = String.format(
            "Citizen question: \"%s\"\n\n" +
            "Grounded historical issue data:\n%s",
            question, context.isEmpty() ? "(No historical issue records match this query)" : context
        );

        return askGeminiDirect(systemInstruction, userContent);
    }

    /** Direct (non-vision) Gemini text call — used both for the grounded
     *  generation step and as a graceful fallback when embeddings fail. */
    private String askGeminiDirect(String systemInstruction, String userContent) {
        if (isKeyMissing()) {
            return "I'm currently unable to answer questions — AI service is not " +
                   "configured. Please contact support or check back later.";
        }
        try {
            String requestBody;
            if (systemInstruction != null) {
                requestBody = """
                    {
                      "contents": [{
                        "role": "user",
                        "parts": [{ "text": "%s" }]
                      }],
                      "system_instruction": {
                        "parts": [{ "text": "%s" }]
                      },
                      "generationConfig": { "temperature": 0.3, "maxOutputTokens": 300 }
                    }
                    """.formatted(escapeJson(userContent), escapeJson(systemInstruction));
            } else {
                requestBody = """
                    {
                      "contents": [{ "parts": [{ "text": "%s" }] }],
                      "generationConfig": { "temperature": 0.3, "maxOutputTokens": 300 }
                    }
                    """.formatted(escapeJson(userContent));
            }

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GEMINI_URL + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = client.send(
                    request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini chat error {}: {}", response.statusCode(), response.body());
                return "I'm having trouble answering right now. Please try again shortly.";
            }

            ObjectMapper mapper = new ObjectMapper();
            var root = mapper.readTree(response.body());
            return root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText("I couldn't generate a response.");

        } catch (Exception e) {
            log.error("Gemini chat call failed: {}", e.getMessage());
            return "I'm having trouble answering right now. Please try again shortly.";
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void saveAssistantMessage(User user, String content, List<Long> sourceIds) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            String idsJson = mapper.writeValueAsString(sourceIds);
            chatMessageRepository.save(ChatMessage.builder()
                    .user(user).role("ASSISTANT").content(content)
                    .retrievedIssueIds(idsJson).build());
        } catch (Exception e) {
            log.error("Failed to save chat message: {}", e.getMessage());
        }
    }

    private ChatSource toSourceSummary(ScoredIssue si) {
        return new ChatSource(
                si.issue.getId(), si.issue.getTitle(),
                si.issue.getCategory(),
                si.issue.getZone() != null ? si.issue.getZone().name() : "Unknown",
                Math.round(si.similarity * 100));
    }

    /** Rough placeholder estimate when no resolved-at timestamp exists yet —
     *  swap for a real resolvedAt column if you add one. */
    private long estimateResolutionDays(Issue issue) {
        return 4; // safe default
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }

    private boolean isKeyMissing() {
        return apiKey == null || apiKey.isBlank()
                || apiKey.equals("NOTSET")
                || apiKey.equals("YOUR_GEMINI_API_KEY_HERE");
    }

    private String escapeJson(String text) {
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    private record ScoredIssue(Issue issue, double similarity) {}

    public record ChatSource(Long issueId, String title, String category,
                              String zone, long relevancePercent) {}

    public record ChatAnswer(String answer, List<ChatSource> sources, boolean grounded) {}
}
