package com.civic.issue.service.impl;

import com.civic.issue.dto.request.*;
import com.civic.issue.dto.response.CommentResponse;
import com.civic.issue.dto.response.IssueResponse;
import com.civic.issue.entity.Comment;
import com.civic.issue.entity.Issue;
import com.civic.issue.entity.Notification;
import com.civic.issue.entity.User;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import com.civic.issue.exception.IssueRejectionException;
import com.civic.issue.exception.ResourceNotFoundException;
import com.civic.issue.exception.UnauthorizedException;
import com.civic.issue.repository.*;
import com.civic.issue.service.AnalyticsSyncService;
import com.civic.issue.service.CaptchaService;
import com.civic.issue.service.CloudinaryService;
import com.civic.issue.service.IssueService;
import com.civic.issue.service.ZoneDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository        issueRepository;
    private final UserRepository         userRepository;
    private final CommentRepository      commentRepository;
    private final NotificationRepository notificationRepository;
    private final ZoneDetector           zoneDetector;
    private final CaptchaService         captchaService;
    private final CloudinaryService      cloudinaryService;
    private final AnalyticsSyncService   analyticsSyncService;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse createIssue(IssueRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);

        // Verify reCAPTCHA
        if (!captchaService.verify(request.getCaptchaToken())) {
            throw new IssueRejectionException(
                    "CAPTCHA verification failed. Please complete the CAPTCHA and try again.");
        }

        Zone detectedZone = zoneDetector.detectZone(
                request.getLatitude(), request.getLongitude());

        Optional<User> regionalAdmin = userRepository
                .findByRoleAndZone(RoleType.REGIONAL_ADMIN, detectedZone);

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .createdBy(user)
                .zone(detectedZone)
                .assignedTo(regionalAdmin.orElse(null))
                .build();

        if (regionalAdmin.isEmpty() && detectedZone != Zone.UNASSIGNED) {
            log.warn("No regional admin found for zone: {}. Issue #{} left unassigned.", detectedZone, issue.getTitle());
        }

        Issue saved = issueRepository.save(issue);
        
        // Real-time analytics sync for new complaint
        analyticsSyncService.syncSingleIssue(saved);

        log.info("Issue #{} created → Zone: {} → Assigned: {}",
                saved.getId(), detectedZone,
                regionalAdmin.map(User::getEmail).orElse("UNASSIGNED"));

        return mapToResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getAllIssues() {
        return issueRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getMyIssues(String userEmail) {
        User user = findUserByEmail(userEmail);
        return issueRepository.findByCreatedByOrderByCreatedAtDesc(user)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public IssueResponse getIssueById(Long id) {
        return mapToResponse(findIssueById(id));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS UPDATE (generic — for PENDING → IN_PROGRESS etc.)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request, String userEmail) {
        Issue issue       = findIssueById(id);
        User  currentUser = findUserByEmail(userEmail);

        checkZonePermission(issue, currentUser);

        // Guard: use resolveIssue() for RESOLVED — it requires a photo
        if (request.getStatus() == IssueStatus.RESOLVED) {
            throw new IssueRejectionException(
                    "To mark as Resolved you must upload a proof photo. Use the 'Mark as Resolved' button.");
        }

        issue.setStatus(request.getStatus());
        Issue updated = issueRepository.save(issue);

        // Real-time analytics sync for status update
        analyticsSyncService.syncSingleIssue(updated);

        notify(issue.getCreatedBy(),
                String.format("Your issue '%s' status updated to %s.",
                        issue.getTitle(), request.getStatus().name()));

        log.info("Issue #{} → {} by {}", id, request.getStatus(), userEmail);
        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ RESOLVE — Admin uploads proof photo, status → RESOLVED
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse resolveIssue(Long id, ResolveIssueRequest request, String userEmail) {
        Issue issue       = findIssueById(id);
        User  currentUser = findUserByEmail(userEmail);

        checkZonePermission(issue, currentUser);

        if (issue.getStatus() == IssueStatus.CLOSED) {
            throw new IssueRejectionException("Issue is already closed.");
        }

        issue.setStatus(IssueStatus.RESOLVED);
        issue.setResolvedImageUrl(request.getResolvedImageUrl());
        issue.setResolvedImagePublicId(request.getResolvedImagePublicId());
        issue.setReopenNote(null); // clear any previous reopen note
        issue.setResolvedAt(LocalDateTime.now()); // ✅ set BEFORE save so it is persisted
        Issue updated = issueRepository.save(issue);

        // Notify reporter to verify the fix
        notify(issue.getCreatedBy(), String.format(
                "🔧 Your issue '%s' has been resolved. Please check the proof photo and confirm.",
                issue.getTitle()));

        // ✅ Real-time analytics sync — fail silently if analytics server is down
        try {
            analyticsSyncService.syncSingleIssue(updated);
        } catch (Exception ex) {
            log.warn("[Analytics] Real-time sync failed for issue #{}: {}", id, ex.getMessage());
        }

        log.info("Issue #{} RESOLVED by {} — proof: {}", id, userEmail, request.getResolvedImageUrl());
        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ CONFIRM RESOLUTION — Reporter says "Yes, it's fixed" → CLOSED
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse confirmResolution(Long id, String userEmail) {
        Issue issue    = findIssueById(id);
        User  reporter = findUserByEmail(userEmail);

        // Only the original reporter can confirm
        if (!issue.getCreatedBy().getId().equals(reporter.getId())) {
            throw new UnauthorizedException("Only the issue reporter can confirm resolution.");
        }

        if (issue.getStatus() != IssueStatus.RESOLVED) {
            throw new IssueRejectionException(
                    "Issue is not in RESOLVED state. Current status: " + issue.getStatus());
        }

        issue.setStatus(IssueStatus.CLOSED);
        issue.setClosedAt(LocalDateTime.now());
        Issue updated = issueRepository.save(issue);

        // ✅ Storage Optimization: Delete the ORIGINAL evidence image after reporter is satisfied
        if (issue.getImagePublicId() != null) {
            cloudinaryService.deleteImage(issue.getImagePublicId());
            issue.setImagePublicId(null);
            issue.setImageUrl(null); // Optional: break the link in DB too if you want to optimize DB
            issueRepository.save(issue);
        }

        // Notify the admin/assigned person
        User toNotify = issue.getAssignedTo() != null ? issue.getAssignedTo() : null;
        if (toNotify != null) {
            notify(toNotify, String.format(
                    "✅ Reporter confirmed issue #%d '%s' is resolved. Issue closed.",
                    issue.getId(), issue.getTitle()));
        }

        log.info("Issue #{} CLOSED — confirmed by reporter: {}", id, userEmail);
        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ REOPEN — Reporter says "Not fixed yet" → REOPENED
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse reopenIssue(Long id, ReopenIssueRequest request, String userEmail) {
        Issue issue    = findIssueById(id);
        User  reporter = findUserByEmail(userEmail);

        // Only the original reporter can reopen
        if (!issue.getCreatedBy().getId().equals(reporter.getId())) {
            throw new UnauthorizedException("Only the issue reporter can reopen this issue.");
        }

        if (issue.getStatus() != IssueStatus.RESOLVED) {
            throw new IssueRejectionException(
                    "Issue can only be reopened when in RESOLVED state.");
        }

        issue.setStatus(IssueStatus.REOPENED);
        issue.setReopenNote(request.getNote());
        issue.setResolvedImageUrl(null); // clear old resolved photo — admin must re-upload
        Issue updated = issueRepository.save(issue);

        // Notify the assigned admin with the reporter's note
        User toNotify = issue.getAssignedTo() != null ? issue.getAssignedTo() : null;
        String noteText = (request.getNote() != null && !request.getNote().isBlank())
                ? " Note: \"" + request.getNote() + "\""
                : "";

        if (toNotify != null) {
            notify(toNotify, String.format(
                    "⚠️ Reporter says issue #%d '%s' is NOT fixed yet.%s",
                    issue.getId(), issue.getTitle(), noteText));
        }

        log.info("Issue #{} REOPENED by reporter: {} — note: {}", id, userEmail, request.getNote());
        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteIssue(Long id) {
        Issue issue = findIssueById(id);
        
        // ✅ Delete all associated images from Cloudinary
        if (issue.getImagePublicId() != null) {
            cloudinaryService.deleteImage(issue.getImagePublicId());
        }
        if (issue.getResolvedImagePublicId() != null) {
            cloudinaryService.deleteImage(issue.getResolvedImagePublicId());
        }
        
        issueRepository.delete(issue);
        log.info("Issue #{} deleted and images removed from Cloudinary", id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMMENT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CommentResponse addComment(Long issueId, CommentRequest request, String userEmail) {
        User  user  = findUserByEmail(userEmail);
        Issue issue = findIssueById(issueId);

        Comment saved = commentRepository.save(Comment.builder()
                .text(request.getText())
                .user(user)
                .issue(issue)
                .build());

        return CommentResponse.builder()
                .id(saved.getId())
                .text(saved.getText())
                .createdAt(saved.getCreatedAt())
                .userId(user.getId())
                .userName(user.getName())
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** ADMIN → any issue. REGIONAL_ADMIN → only their zone. */
    private void checkZonePermission(Issue issue, User currentUser) {
        if (currentUser.getRole() == RoleType.ADMIN) return;
        if (currentUser.getRole() == RoleType.REGIONAL_ADMIN) {
            boolean isTheirZone     = issue.getZone() != null
                    && issue.getZone() == currentUser.getZone();
            boolean isAssignedToThem = issue.getAssignedTo() != null
                    && issue.getAssignedTo().getId().equals(currentUser.getId());
            if (!isTheirZone && !isAssignedToThem) {
                throw new UnauthorizedException(
                        "You can only manage issues in your zone: " + currentUser.getZone());
            }
        } else {
            throw new UnauthorizedException("Permission denied.");
        }
    }

    private void notify(User user, String message) {
        notificationRepository.save(Notification.builder()
                .message(message).user(user).build());
    }

    private IssueResponse mapToResponse(Issue issue) {
        List<CommentResponse> comments = issue.getComments().stream()
                .map(c -> CommentResponse.builder()
                        .id(c.getId()).text(c.getText())
                        .createdAt(c.getCreatedAt())
                        .userId(c.getUser().getId())
                        .userName(c.getUser().getName())
                        .build())
                .toList();

        IssueResponse.UserSummary createdBy = IssueResponse.UserSummary.builder()
                .id(issue.getCreatedBy().getId())
                .name(issue.getCreatedBy().getName())
                .email(issue.getCreatedBy().getEmail())
                .build();

        IssueResponse.UserSummary assignedTo = issue.getAssignedTo() != null
                ? IssueResponse.UserSummary.builder()
                        .id(issue.getAssignedTo().getId())
                        .name(issue.getAssignedTo().getName())
                        .email(issue.getAssignedTo().getEmail())
                        .build()
                : null;

        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .category(issue.getCategory())
                .status(issue.getStatus())
                .zone(issue.getZone())
                .imageUrl(issue.getImageUrl())
                .resolvedImageUrl(issue.getResolvedImageUrl())   // ✅
                .reopenNote(issue.getReopenNote())               // ✅
                .latitude(issue.getLatitude())
                .longitude(issue.getLongitude())
                .createdAt(issue.getCreatedAt())
                .createdBy(createdBy)
                .assignedTo(assignedTo)
                .comments(comments)
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private Issue findIssueById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", id));
    }
}
