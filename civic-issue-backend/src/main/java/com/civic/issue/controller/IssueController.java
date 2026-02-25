package com.civic.issue.controller;

import com.civic.issue.dto.request.CommentRequest;
import com.civic.issue.dto.request.IssueRequest;
import com.civic.issue.dto.request.UpdateStatusRequest;
import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.dto.response.CommentResponse;
import com.civic.issue.dto.response.IssueResponse;
import com.civic.issue.dto.response.UploadResponse;
import com.civic.issue.service.CloudinaryService;
import com.civic.issue.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService      issueService;
    private final CloudinaryService cloudinaryService;

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
    public ResponseEntity<ApiResponse<IssueResponse>> getIssueById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(issueService.getIssueById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<IssueResponse>> createIssue(
            @Valid @RequestBody IssueRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        IssueResponse response = issueService.createIssue(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Issue created successfully", response));
    }

    /**
     * POST /api/issues/upload-image
     * ✅ capturedAt is optional (required=false) — won't fail if frontend skips it
     */
    @PostMapping("/upload-image")
    public ResponseEntity<ApiResponse<UploadResponse>> uploadImage(
            @RequestParam("file")                                    MultipartFile file,
            @RequestParam(value = "capturedAt",  required = false)  String  capturedAt,
            @RequestParam(value = "latitude",    required = false)  Double  latitude,
            @RequestParam(value = "longitude",   required = false)  Double  longitude,
            @AuthenticationPrincipal UserDetails userDetails) throws IOException {

        UploadResponse response = cloudinaryService.uploadEvidenceImage(
                file, capturedAt, latitude, longitude, userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploaded successfully", response));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','REGIONAL_ADMIN')")
    public ResponseEntity<ApiResponse<IssueResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {  // ✅ add this

        IssueResponse response = issueService.updateIssueStatus(
                id, request, userDetails.getUsername());          // ✅ pass email

        return ResponseEntity.ok(ApiResponse.success("Issue status updated", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteIssue(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.ok(ApiResponse.success("Issue deleted successfully", null));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponse response = issueService.addComment(
                id, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added", response));
    }
}
