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
import com.civic.issue.service.*;
import com.civic.issue.util.VectorMathUtil;
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

    private final IssueRepository                issueRepository;
    private final UserRepository                 userRepository;
    private final CommentRepository              commentRepository;
    private final NotificationRepository         notificationRepository;
    private final ZoneDetector                   zoneDetector;
    private final CaptchaService                 captchaService;
    private final PriorityScoreService            priorityScoreService;
    private final SmsNotificationService          smsNotificationService;
    private final EmbeddingService                embeddingService;
    private final CategoryClassificationService   categoryClassificationService;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse createIssue(IssueRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);

        boolean captchaOk;
        try {
            captchaOk = captchaService.verify(request.getCaptchaToken());
        } catch (Exception e) {
            log.error("CAPTCHA service error — allowing submission: {}", e.getMessage());
            captchaOk = true;
        }
        if (!captchaOk) {
            throw new IssueRejectionException(
                    "CAPTCHA verification failed. Please complete the CAPTCHA and try again.");
        }

        return saveNewIssue(request, user);
    }

    @Override
    @Transactional
    public IssueResponse createIssueFromBot(IssueRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);
        return saveNewIssue(request, user); // CAPTCHA bypassed — bot verified via phone
    }

    private IssueResponse saveNewIssue(IssueRequest request, User user) {
        Zone detectedZone = zoneDetector.detectZone(request.getLatitude(), request.getLongitude());
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
                .upvoteCount(0)
                .priorityScore(0.0)
                .build();

        issue.setPriorityScore(priorityScoreService.calculate(issue));

        // ── Generate embedding for RAG retrieval + semantic duplicate search ──
        // Done synchronously here (fast — single embedding call) so the issue
        // is immediately searchable. If Gemini is unavailable this silently
        // leaves embedding null; EmbeddingBackfillScheduler retries later.
        try {
            String textToEmbed = String.format("%s. %s. Category: %s",
                    issue.getTitle(), issue.getDescription(), issue.getCategory());
            float[] embedding = embeddingService.embed(textToEmbed);
            if (embedding != null) {
                issue.setEmbedding(VectorMathUtil.toJson(embedding));
                issue.setEmbeddingUpdatedAt(LocalDateTime.now());
            }
        } catch (Exception e) {
            log.warn("Embedding generation failed for new issue — will backfill later: {}",
                    e.getMessage());
        }

        Issue saved = issueRepository.save(issue);

        log.info("Issue #{} created — Zone: {} — Assigned: {}",
                saved.getId(), detectedZone,
                regionalAdmin.map(User::getEmail).orElse("UNASSIGNED"));

        try { smsNotificationService.notifyAdminNewIssue(saved); }
        catch (Exception e) { log.warn("SMS notification failed: {}", e.getMessage()); }

        return mapToResponse(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getAllIssues() {
        return issueRepository.findAllByOrderByPriorityScoreDesc()
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

    @Override
    @Transactional(readOnly = true)
    public IssueResponse findMostRecentResolvedIssue(String userEmail) {
        User user = findUserByEmail(userEmail);
        return issueRepository
                .findTopByCreatedByAndStatusOrderByCreatedAtDesc(user, IssueStatus.RESOLVED)
                .map(this::mapToResponse)
                .orElse(null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS UPDATE
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request, String userEmail) {
        Issue issue       = findIssueById(id);
        User  currentUser = findUserByEmail(userEmail);
        checkZonePermission(issue, currentUser);

        if (request.getStatus() == IssueStatus.RESOLVED) {
            throw new IssueRejectionException(
                    "Use 'Mark as Resolved' button to upload a proof photo.");
        }

        issue.setStatus(request.getStatus());
        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue updated = issueRepository.save(issue);

        try {
            if (request.getStatus() == IssueStatus.IN_PROGRESS) {
                smsNotificationService.notifyInProgress(updated);
            }
        } catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        notify(issue.getCreatedBy(),
                String.format("Your issue '%s' status updated to %s.",
                        issue.getTitle(), request.getStatus().name()));

        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CATEGORY CORRECTION (fix10) — admin overrides AI-suggested category,
    // which feeds the labeled feedback dataset for future model improvement
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse correctCategory(Long id, String newCategory,
                                          Integer aiConfidenceAtSuggestion, String userEmail) {
        Issue issue       = findIssueById(id);
        User  currentUser = findUserByEmail(userEmail);
        checkZonePermission(issue, currentUser);

        if (!CategoryClassificationService.VALID_CATEGORIES.contains(newCategory)) {
            throw new IssueRejectionException("Invalid category: " + newCategory);
        }

        String oldCategory = issue.getCategory();

        // Log the correction as labeled training data BEFORE overwriting it
        try {
            categoryClassificationService.recordFeedback(
                    issue, oldCategory, aiConfidenceAtSuggestion, newCategory);
        } catch (Exception e) {
            log.warn("Failed to record category feedback: {}", e.getMessage());
        }

        issue.setCategory(newCategory);

        // Re-embed since description+category text changed — keeps semantic
        // search and duplicate detection accurate after the correction.
        try {
            String textToEmbed = String.format("%s. %s. Category: %s",
                    issue.getTitle(), issue.getDescription(), newCategory);
            float[] embedding = embeddingService.embed(textToEmbed);
            if (embedding != null) {
                issue.setEmbedding(VectorMathUtil.toJson(embedding));
                issue.setEmbeddingUpdatedAt(LocalDateTime.now());
            }
        } catch (Exception e) {
            log.warn("Re-embedding after category correction failed: {}", e.getMessage());
        }

        Issue updated = issueRepository.save(issue);
        log.info("Issue #{} category corrected: '{}' → '{}' by {}",
                id, oldCategory, newCategory, userEmail);

        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESOLVE
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
        issue.setReopenNote(null);
        issue.setResolvedAt(LocalDateTime.now());
        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue updated = issueRepository.save(issue);

        notify(issue.getCreatedBy(), String.format(
                "🔧 Your issue '%s' has been resolved. Please verify the proof photo.",
                issue.getTitle()));

        try { smsNotificationService.notifyResolved(updated); }
        catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        log.info("Issue #{} RESOLVED by {}", id, userEmail);
        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIRM RESOLUTION
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse confirmResolution(Long id, String userEmail) {
        Issue issue    = findIssueById(id);
        User  reporter = findUserByEmail(userEmail);

        if (!issue.getCreatedBy().getId().equals(reporter.getId())) {
            throw new UnauthorizedException("Only the issue reporter can confirm resolution.");
        }
        if (issue.getStatus() != IssueStatus.RESOLVED) {
            throw new IssueRejectionException(
                    "Issue is not in RESOLVED state. Current: " + issue.getStatus());
        }

        issue.setStatus(IssueStatus.CLOSED);
        issue.setClosedAt(LocalDateTime.now());
        issue.setPriorityScore(0.0);
        Issue updated = issueRepository.save(issue);

        try { smsNotificationService.notifyClosed(updated); }
        catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        User admin = issue.getAssignedTo();
        if (admin != null) {
            notify(admin, String.format(
                    "✅ Reporter confirmed issue #%d '%s' is resolved. Issue closed.",
                    issue.getId(), issue.getTitle()));
        }

        log.info("Issue #{} CLOSED — confirmed by {}", id, userEmail);
        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REOPEN
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public IssueResponse reopenIssue(Long id, ReopenIssueRequest request, String userEmail) {
        Issue issue    = findIssueById(id);
        User  reporter = findUserByEmail(userEmail);

        if (!issue.getCreatedBy().getId().equals(reporter.getId())) {
            throw new UnauthorizedException("Only the issue reporter can reopen this issue.");
        }
        if (issue.getStatus() != IssueStatus.RESOLVED) {
            throw new IssueRejectionException(
                    "Issue can only be reopened when in RESOLVED state.");
        }

        issue.setStatus(IssueStatus.REOPENED);
        issue.setReopenNote(request.getNote());
        issue.setResolvedImageUrl(null);
        issue.setResolvedAt(null);
        issue.setClosedAt(null);
        issue.setPriorityScore(priorityScoreService.calculate(issue));

        Issue updated = issueRepository.save(issue);

        try { smsNotificationService.notifyAdminReopened(updated); }
        catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        User admin = issue.getAssignedTo();
        if (admin != null) {
            String note = request.getNote() != null && !request.getNote().isBlank()
                    ? " Note: \"" + request.getNote() + "\""
                    : "";
            notify(admin, String.format(
                    "⚠️ Reporter says issue #%d '%s' is NOT fixed.%s",
                    issue.getId(), issue.getTitle(), note));
        }

        log.info("Issue #{} REOPENED by {}", id, userEmail);
        return mapToResponse(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE / COMMENT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteIssue(Long id) {
        issueRepository.delete(findIssueById(id));
    }

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

    private void checkZonePermission(Issue issue, User currentUser) {
        if (currentUser.getRole() == RoleType.ADMIN) return;
        if (currentUser.getRole() == RoleType.REGIONAL_ADMIN) {
            boolean sameZone     = issue.getZone() != null
                    && issue.getZone() == currentUser.getZone();
            boolean assignedToMe = issue.getAssignedTo() != null
                    && issue.getAssignedTo().getId().equals(currentUser.getId());
            if (!sameZone && !assignedToMe)
                throw new UnauthorizedException(
                        "You can only manage issues in your zone: " + currentUser.getZone());
        } else {
            throw new UnauthorizedException("Permission denied.");
        }
    }

    private void notify(User user, String message) {
        notificationRepository.save(Notification.builder()
                .message(message).user(user).build());
    }

    private IssueResponse mapToResponse(Issue issue) {
        List<CommentResponse> comments = issue.getComments() == null
                ? List.of()
                : issue.getComments().stream()
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
                .imageUrl(issue.getImageUrl())
                .resolvedImageUrl(issue.getResolvedImageUrl())
                .reopenNote(issue.getReopenNote())
                .latitude(issue.getLatitude())
                .longitude(issue.getLongitude())
                .zone(issue.getZone())
                .createdAt(issue.getCreatedAt())
                .resolvedAt(issue.getResolvedAt())
                .closedAt(issue.getClosedAt())
                .createdBy(createdBy)
                .assignedTo(assignedTo)
                .comments(comments)
                .upvoteCount(issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0)
                .priorityScore(issue.getPriorityScore() != null ? issue.getPriorityScore() : 0.0)
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
