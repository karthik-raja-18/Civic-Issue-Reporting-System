package com.civic.issue.controller;

import com.civic.issue.dto.request.AssignIssueRequest;
import com.civic.issue.dto.request.CreateRegionalAdminRequest;
import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.dto.response.IssueResponse;
import com.civic.issue.dto.response.RegionalAdminResponse;
import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import com.civic.issue.exception.DuplicateResourceException;
import com.civic.issue.exception.ResourceNotFoundException;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.ZoneDetector;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RegionalAdminController {

    private final UserRepository  userRepository;
    private final IssueRepository issueRepository;
    private final ZoneDetector    zoneDetector;
    private final PasswordEncoder passwordEncoder;

    // ═══════════════════════════════════════════════════════════════════
    // SUPER ADMIN endpoints — /api/admin/regional-admins
    // ═══════════════════════════════════════════════════════════════════

    /**
     * POST /api/admin/regional-admins
     * Create a new Regional Admin for a specific zone.
     * ADMIN only.
     */
    @PostMapping("/api/admin/regional-admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RegionalAdminResponse>> createRegionalAdmin(
            @Valid @RequestBody CreateRegionalAdminRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Email already registered: " + request.getEmail());
        }

        User admin = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(RoleType.REGIONAL_ADMIN)
                .zone(request.getZone())
                .build();

        User saved = userRepository.save(admin);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Regional admin created successfully",
                        toRegionalAdminResponse(saved)));
    }

    /**
     * GET /api/admin/regional-admins
     * List all regional admins with their zone stats.
     * ADMIN only.
     */
    @GetMapping("/api/admin/regional-admins")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RegionalAdminResponse>>> getAllRegionalAdmins() {
        List<RegionalAdminResponse> admins = userRepository
                .findByRole(RoleType.REGIONAL_ADMIN)
                .stream()
                .map(this::toRegionalAdminResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(admins));
    }

    /**
     * DELETE /api/admin/regional-admins/{id}
     * Remove a regional admin.
     * ADMIN only.
     */
    @DeleteMapping("/api/admin/regional-admins/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRegionalAdmin(@PathVariable Long id) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Regional admin", id));

        if (admin.getRole() != RoleType.REGIONAL_ADMIN) {
            throw new IllegalArgumentException("User is not a regional admin");
        }

        // Unassign issues from this admin
        List<Issue> assignedIssues = issueRepository.findByAssignedTo(admin);
        assignedIssues.forEach(i -> i.setAssignedTo(null));
        issueRepository.saveAll(assignedIssues);

        userRepository.delete(admin);
        return ResponseEntity.ok(ApiResponse.success("Regional admin deleted", null));
    }

    /**
     * GET /api/admin/issues/unassigned
     * Get all issues that have no assigned regional admin.
     * ADMIN only.
     */
    @GetMapping("/api/admin/issues/unassigned")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<IssueResponse>>> getUnassignedIssues() {
        List<IssueResponse> issues = issueRepository.findByAssignedToIsNull()
                .stream()
                .map(this::toIssueResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(issues));
    }

    /**
     * PUT /api/admin/issues/{id}/assign
     * Manually assign an issue to a specific regional admin.
     * ADMIN only.
     */
    @PutMapping("/api/admin/issues/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<IssueResponse>> assignIssue(
            @PathVariable Long id,
            @Valid @RequestBody AssignIssueRequest request) {

        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", id));

        User admin = userRepository.findById(request.getAdminId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Regional admin", request.getAdminId()));

        if (admin.getRole() != RoleType.REGIONAL_ADMIN) {
            throw new IllegalArgumentException(
                    "Target user is not a regional admin");
        }

        issue.setAssignedTo(admin);
        issue.setZone(admin.getZone());
        issueRepository.save(issue);

        return ResponseEntity.ok(ApiResponse.success(
                "Issue assigned to " + admin.getName(), toIssueResponse(issue)));
    }

    // ═══════════════════════════════════════════════════════════════════
    // REGIONAL ADMIN endpoints — /api/regional/...
    // ═══════════════════════════════════════════════════════════════════

    /**
     * GET /api/regional/issues
     * Regional admin sees ONLY issues in their zone.
     */
    @GetMapping("/api/regional/issues")
    @PreAuthorize("hasAnyRole('ADMIN','REGIONAL_ADMIN')")
    public ResponseEntity<ApiResponse<List<IssueResponse>>> getZoneIssues(
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        List<Issue> issues;
        if (currentUser.getRole() == RoleType.ADMIN) {
            // ADMIN sees all
            issues = issueRepository.findAllByOrderByCreatedAtDesc();
        } else {
            // REGIONAL_ADMIN sees only their zone
            issues = issueRepository.findByZoneOrderByCreatedAtDesc(currentUser.getZone());
        }

        return ResponseEntity.ok(ApiResponse.success(
                issues.stream().map(this::toIssueResponse).toList()));
    }

    /**
     * GET /api/regional/dashboard/stats
     * Zone statistics for regional admin dashboard.
     */
    @GetMapping("/api/regional/dashboard/stats")
    @PreAuthorize("hasAnyRole('ADMIN','REGIONAL_ADMIN')")
    public ResponseEntity<ApiResponse<Object>> getZoneStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        Zone zone = currentUser.getZone();
        List<Issue> zoneIssues = (currentUser.getRole() == RoleType.ADMIN)
                ? issueRepository.findAllByOrderByCreatedAtDesc()
                : issueRepository.findByZoneOrderByCreatedAtDesc(zone);

        var stats = new java.util.HashMap<String, Object>();
        stats.put("zone",       zone != null ? zone.name() : "ALL");
        stats.put("zoneDesc",   zone != null
                ? zoneDetector.getZoneDescription(zone)
                : "All Zones");
        stats.put("total",      zoneIssues.size());
        stats.put("pending",    zoneIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.PENDING).count());
        stats.put("inProgress", zoneIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count());
        stats.put("resolved",   zoneIssues.stream()
                .filter(i -> i.getStatus() == IssueStatus.RESOLVED).count());

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ── Private mappers ───────────────────────────────────────────────────────

    private RegionalAdminResponse toRegionalAdminResponse(User admin) {
        List<Issue> zoneIssues = (admin.getZone() != null)
                ? issueRepository.findByZoneOrderByCreatedAtDesc(admin.getZone())
                : List.of();

        return RegionalAdminResponse.builder()
                .id(admin.getId())
                .name(admin.getName())
                .email(admin.getEmail())
                .zone(admin.getZone())
                .zoneDescription(admin.getZone() != null
                        ? zoneDetector.getZoneDescription(admin.getZone())
                        : "No zone assigned")
                .totalIssues(zoneIssues.size())
                .pendingIssues(zoneIssues.stream()
                        .filter(i -> i.getStatus() == IssueStatus.PENDING).count())
                .resolvedIssues(zoneIssues.stream()
                        .filter(i -> i.getStatus() == IssueStatus.RESOLVED).count())
                .build();
    }

    private IssueResponse toIssueResponse(Issue issue) {
        var userSummary = IssueResponse.UserSummary.builder()
                .id(issue.getCreatedBy().getId())
                .name(issue.getCreatedBy().getName())
                .email(issue.getCreatedBy().getEmail())
                .build();

        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .category(issue.getCategory())
                .status(issue.getStatus())
                .imageUrl(issue.getImageUrl())
                .latitude(issue.getLatitude())
                .longitude(issue.getLongitude())
                .createdAt(issue.getCreatedAt())
                .createdBy(userSummary)
                .comments(List.of())
                .build();
    }
}
