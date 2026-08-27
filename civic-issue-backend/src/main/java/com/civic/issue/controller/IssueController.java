package com.civic.issue.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.civic.issue.dto.request.*;
import com.civic.issue.dto.response.*;
import com.civic.issue.service.AiValidationService;
import com.civic.issue.service.CloudinaryService;
import com.civic.issue.service.IssueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService          issueService;
    private final CloudinaryService     cloudinaryService;
    private final AiValidationService   aiValidationService;
    private final com.civic.issue.service.UpvoteService upvoteService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IssueResponse>>> getAllIssues(
            @RequestParam(defaultValue = "false") boolean mine,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<IssueResponse> issues = mine
                ? issueService.getMyIssues(userDetails.getUsername())
                : issueService.getAllIssues();
        return ResponseEntity.ok(ApiResponse.success(issues));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IssueResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(issueService.getIssueById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IssueResponse>> create(
            @Valid @RequestBody IssueRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        IssueResponse res = issueService.createIssue(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Issue submitted successfully", res));
    }

    @PostMapping("/validate-ai")
    public ResponseEntity<ApiResponse<AiValidationResponse>> validateWithAi(
            @Valid @RequestBody AiValidateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            AiValidationResponse result = aiValidationService.validate(request);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Throwable t) {
            log.error("Master controller failure in validate-ai", t);
            return ResponseEntity.ok(ApiResponse.success(
                AiValidationResponse.builder()
                    .valid(true)
                    .message("⚠️ AI verification unavailable.")
                    .isFallback(true)
                    .build()
            ));
        }
    }

    @PostMapping("/upload-image")
    public ResponseEntity<ApiResponse<UploadResponse>> uploadImage(
            @RequestParam("file")                                   MultipartFile file,
            @RequestParam(value = "capturedAt",  required = false)  String capturedAt,
            @RequestParam(value = "latitude",    required = false)  Double latitude,
            @RequestParam(value = "longitude",   required = false)  Double longitude,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        UploadResponse res = cloudinaryService.uploadEvidenceImage(
                file, capturedAt, latitude, longitude, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploaded", res));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','REGIONAL_ADMIN')")
    public ResponseEntity<ApiResponse<IssueResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                issueService.updateIssueStatus(id, request, userDetails.getUsername())));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','REGIONAL_ADMIN')")
    public ResponseEntity<ApiResponse<IssueResponse>> resolve(
            @PathVariable Long id,
            @Valid @RequestBody ResolveIssueRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Issue marked as resolved",
                issueService.resolveIssue(id, request, userDetails.getUsername())));
    }

    @PutMapping("/{id}/confirm-resolution")
    public ResponseEntity<ApiResponse<IssueResponse>> confirmResolution(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Issue closed. Thank you!",
                issueService.confirmResolution(id, userDetails.getUsername())));
    }

    @PutMapping("/{id}/reopen")
    public ResponseEntity<ApiResponse<IssueResponse>> reopen(
            @PathVariable Long id,
            @RequestBody(required = false) ReopenIssueRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Issue reopened",
                issueService.reopenIssue(id,
                        request != null ? request : new ReopenIssueRequest(),
                        userDetails.getUsername())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.ok(ApiResponse.success("Issue deleted", null));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comment added",
                issueService.addComment(id, request, userDetails.getUsername())));
    }

    // ── Upvotes ─────────────────────────────────────────────────────────────

    @PostMapping("/{id}/upvote")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> upvote(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Double> coords,
            @AuthenticationPrincipal UserDetails userDetails) {
        Double lat = coords != null ? coords.get("latitude")  : null;
        Double lng = coords != null ? coords.get("longitude") : null;
        
        return ResponseEntity.ok(ApiResponse.success("Upvote toggled",
                upvoteService.toggleUpvote(id, userDetails.getUsername(), lat, lng)));
    }

    @GetMapping("/{id}/upvote")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> getUpvoteStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean voted = upvoteService.hasUpvoted(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("hasUpvoted", voted)));
    }
    @PutMapping("/{id}/correct-category")
    @PreAuthorize("hasAnyRole('ADMIN','REGIONAL_ADMIN')")
    public ResponseEntity<ApiResponse<IssueResponse>> correctCategory(
            @PathVariable Long id,
            @Valid @RequestBody CorrectCategoryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        IssueResponse res = issueService.correctCategory(
                id, request.getNewCategory(), request.getAiConfidenceAtSuggestion(),
                userDetails.getUsername());

        return ResponseEntity.ok(ApiResponse.success("Category corrected", res));
    }

}
