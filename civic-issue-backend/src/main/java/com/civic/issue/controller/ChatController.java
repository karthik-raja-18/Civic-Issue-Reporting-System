package com.civic.issue.controller;

import com.civic.issue.dto.request.ChatRequest;
import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.dto.response.ChatResponse;
import com.civic.issue.entity.ChatMessage;
import com.civic.issue.entity.User;
import com.civic.issue.repository.ChatMessageRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.RagChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final RagChatService        ragChatService;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository        userRepository;

    /**
     * POST /api/chat/ask
     * Ask the "Ask CivicPulse" RAG assistant a question.
     * Body: { "question": "How long does a pothole usually take to fix?" }
     */
    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<ChatResponse>> ask(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        RagChatService.ChatAnswer answer = ragChatService.ask(
                userDetails.getUsername(), request.getQuestion());

        ChatResponse response = ChatResponse.builder()
                .answer(answer.answer())
                .grounded(answer.grounded())
                .sources(answer.sources().stream()
                        .map(s -> ChatResponse.Source.builder()
                                .issueId(s.issueId())
                                .title(s.title())
                                .category(s.category())
                                .zone(s.zone())
                                .relevancePercent(s.relevancePercent())
                                .build())
                        .toList())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/chat/history
     * Get the logged-in user's chat history with the assistant.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<ChatMessage> history = chatMessageRepository.findByUserOrderByCreatedAtAsc(user);

        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
