package com.civic.issue.controller;

import com.civic.issue.dto.request.CommentRequest;
import com.civic.issue.dto.request.IssueRequest;
import com.civic.issue.dto.request.UpdateStatusRequest;
import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.dto.response.CommentResponse;
import com.civic.issue.dto.response.IssueResponse;
import com.civic.issue.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    /**
     * GET /api/issues
     * Retrieve all issues (all authenticated users).
     * USER can optionally use ?mine=true to see only their issues.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<IssueResponse>>> getAllIssues(
            @RequestParam(defaultValue = "false") boolean mine,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<IssueResponse> issues = mine
                ? issueService.getMyIssues(userDetails.getUsername())
                : issueService.getAllIssues();

        return ResponseEntity.ok(ApiResponse.success(issues));
    }

    /**
     * GET /api/issues/{id}
     * Get a single issue by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IssueResponse>> getIssueById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(issueService.getIssueById(id)));
    }

    /**
     * POST /api/issues
     * Create a new issue (USER / ADMIN).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<IssueResponse>> createIssue(
            @Valid @RequestBody IssueRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        IssueResponse response = issueService.createIssue(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Issue created successfully", response));
    }

    /**
     * PUT /api/issues/{id}/status
     * Update issue status — ADMIN only.
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<IssueResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {

        IssueResponse response = issueService.updateIssueStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Issue status updated", response));
    }

    /**
     * DELETE /api/issues/{id}
     * Delete a fake/spam issue — ADMIN only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteIssue(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.ok(ApiResponse.success("Issue deleted successfully", null));
    }

    /**
     * POST /api/issues/{id}/comments
     * Add a comment to an issue (any authenticated user).
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        CommentResponse response = issueService.addComment(id, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added", response));
    }
}
