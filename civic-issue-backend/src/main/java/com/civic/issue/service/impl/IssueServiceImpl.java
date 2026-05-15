package com.civic.issue.service.impl;

import com.civic.issue.dto.request.*;
import com.civic.issue.dto.response.*;
import com.civic.issue.entity.*;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.enums.RoleType;
import com.civic.issue.exception.IssueRejectionException;
import com.civic.issue.exception.ResourceNotFoundException;
import com.civic.issue.exception.UnauthorizedException;
import com.civic.issue.repository.*;
import com.civic.issue.service.IssueService;
import com.civic.issue.service.PriorityScoreService;
import com.civic.issue.service.SmsNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IssueServiceImpl implements IssueService {

    private static final Logger log = LoggerFactory.getLogger(IssueServiceImpl.class);

    private final IssueRepository           issueRepository;
    private final UserRepository            userRepository;
    private final NotificationRepository    notificationRepository;
    private final CommentRepository         commentRepository;
    private final IssueUpvoteRepository     upvoteRepository;
    private final PriorityScoreService      priorityScoreService;
    private final SmsNotificationService    smsNotificationService;
    private final com.civic.issue.service.CaptchaService captchaService;
    private final com.civic.issue.service.ZoneDetector zoneDetector;

    public IssueServiceImpl(
            IssueRepository           issueRepository,
            UserRepository            userRepository,
            NotificationRepository    notificationRepository,
            CommentRepository         commentRepository,
            IssueUpvoteRepository     upvoteRepository,
            PriorityScoreService      priorityScoreService,
            SmsNotificationService    smsNotificationService,
            com.civic.issue.service.CaptchaService captchaService,
            com.civic.issue.service.ZoneDetector zoneDetector) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.commentRepository = commentRepository;
        this.upvoteRepository = upvoteRepository;
        this.priorityScoreService = priorityScoreService;
        this.smsNotificationService = smsNotificationService;
        this.captchaService = captchaService;
        this.zoneDetector = zoneDetector;
    }

    @Override
    @Transactional
    public IssueResponse createIssue(IssueRequest request, String userEmail) {
        boolean captchaOk;
        try { 
            captchaOk = captchaService.verify(request.getCaptchaToken()); 
        } catch (Exception e) {
            log.error("CAPTCHA check failed — allowing: {}", e.getMessage());
            captchaOk = true;
        }
        if (!captchaOk) throw new IssueRejectionException("CAPTCHA failed.");

        User creator = findUserByEmail(userEmail);
        Issue issue = Issue.builder()
                .title(request.getTitle()).description(request.getDescription())
                .category(request.getCategory()).imageUrl(request.getImageUrl())
                .latitude(request.getLatitude()).longitude(request.getLongitude())
                .zone(zoneDetector.detectZone(request.getLatitude(), request.getLongitude()))
                .createdBy(creator).build();

        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue saved = issueRepository.save(issue);
        log.info("Issue #{} created by {}", saved.getId(), userEmail);
        
        // Notify Zone Admin about NEW issue
        notifyZoneAdmin(saved, String.format("New Case Logged: A new %s report (#%d) has been opened in your zone.", saved.getCategory(), saved.getId()));
        
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public IssueResponse createIssueFromBot(IssueRequest request, String userEmail) {
        // Skips captcha — intended for WhatsApp/SMS
        return createIssue(request, userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getAllIssues() {
        // Sorted by priority score DESC
        return issueRepository.findAllByOrderByPriorityScoreDesc().stream()
                .map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getMyIssues(String userEmail) {
        User user = findUserByEmail(userEmail);
        return issueRepository.findByCreatedByOrderByCreatedAtDesc(user).stream()
                .map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public IssueResponse getIssueById(Long id) {
        return mapToResponse(findIssueById(id));
    }

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request, String userEmail) {
        Issue issue       = findIssueById(id);
        User  currentUser = findUserByEmail(userEmail);
        checkZonePermission(issue, currentUser);

        if (request.getStatus() == IssueStatus.RESOLVED) {
            throw new IssueRejectionException("Mandatory evidence required. Use 'Mark as Resolved' to upload a photo.");
        }
        if (request.getStatus() == IssueStatus.CLOSED) {
            throw new IssueRejectionException("Only the original reporter can confirm resolution and CLOSE this issue.");
        }
        if (request.getStatus() == IssueStatus.REOPENED) {
            throw new IssueRejectionException("Only the original reporter can REOPEN this issue if they are unsatisfied with the fix.");
        }

        issue.setStatus(request.getStatus());
        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue updated = issueRepository.save(issue);

        try {
            if (request.getStatus() == IssueStatus.IN_PROGRESS) {
                smsNotificationService.notifyInProgress(updated);
            }
        } catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        notify(issue.getCreatedBy(), String.format("Status of '%s' updated to %s", issue.getTitle(), request.getStatus()), issue.getId());
        if (request.getStatus() == IssueStatus.IN_PROGRESS) {
            notifyZoneAdmin(issue, String.format("Operational Update: Work has started on case #%d in your zone.", issue.getId()));
        }
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public IssueResponse resolveIssue(Long id, ResolveIssueRequest request, String userEmail) {
        Issue issue       = findIssueById(id);
        User  currentUser = findUserByEmail(userEmail);
        checkZonePermission(issue, currentUser);

        issue.setStatus(IssueStatus.RESOLVED);
        issue.setResolvedImageUrl(request.getResolvedImageUrl());
        issue.setResolvedAt(LocalDateTime.now());
        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue updated = issueRepository.save(issue);
        ensureZoneSet(updated);

        try { smsNotificationService.notifyResolved(updated); }
        catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        notify(issue.getCreatedBy(), String.format("ACTION COMPLETED: Your report '%s' has been officially RESOLVED. Please verify the fix.", issue.getTitle()), issue.getId());
        notifyZoneAdmin(updated, String.format("RESOLUTION POSTED: Case #%d has been RESOLVED by the assigned official. Awaiting citizen verification.", updated.getId()));
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public IssueResponse confirmResolution(Long id, String userEmail) {
        Issue issue    = findIssueById(id);
        User  reporter = findUserByEmail(userEmail);

        if (!issue.getCreatedBy().getId().equals(reporter.getId())) {
            throw new UnauthorizedException("Only the reporter can confirm resolution.");
        }

        issue.setStatus(IssueStatus.CLOSED);
        issue.setClosedAt(LocalDateTime.now());
        issue.setPriorityScore(0.0);
        Issue updated = issueRepository.save(issue);
        ensureZoneSet(updated);

        try { smsNotificationService.notifyClosed(updated); }
        catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        notifyZoneAdmin(updated, String.format("Success: Citizen has verified and CLOSED case #%d in your zone.", updated.getId()));
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public IssueResponse reopenIssue(Long id, ReopenIssueRequest request, String userEmail) {
        Issue issue    = findIssueById(id);
        User  reporter = findUserByEmail(userEmail);

        if (!issue.getCreatedBy().getId().equals(reporter.getId())) {
            throw new UnauthorizedException("Only the reporter can reopen.");
        }

        issue.setStatus(IssueStatus.REOPENED);
        issue.setReopenNote(request.getNote());
        issue.setResolvedImageUrl(null);
        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue updated = issueRepository.save(issue);
        ensureZoneSet(updated);

        try { smsNotificationService.notifyAdminReopened(updated); }
        catch (Exception e) { log.warn("SMS failed: {}", e.getMessage()); }

        if (updated.getAssignedTo() != null) {
            notify(updated.getAssignedTo(), String.format("URGENT: Case #%d ('%s') was REOPENED by the reporter. Re-evaluation required.", updated.getId(), updated.getTitle()), updated.getId());
        }
        notifyZoneAdmin(updated, String.format("Dispute Alert: Case #%d ('%s') has been REOPENED. Citizen is unsatisfied with the fix.", updated.getId(), updated.getTitle()));

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public IssueResponse upvoteIssue(Long id, String userEmail) {
        Issue issue = findIssueById(id);
        User user = findUserByEmail(userEmail);

        if (upvoteRepository.existsByIssueAndUser(issue, user)) {
            // Un-upvote logic
            upvoteRepository.findByIssueAndUser(issue, user).ifPresent(upvoteRepository::delete);
            issue.setUpvoteCount(Math.max(0, (issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 1) - 1));
        } else {
            // Upvote logic
            upvoteRepository.save(IssueUpvote.builder().issue(issue).user(user).build());
            issue.setUpvoteCount((issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0) + 1);
        }

        issue.setPriorityScore(priorityScoreService.calculate(issue));
        Issue saved = issueRepository.save(issue);
        return mapToResponse(saved);
    }

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

        Comment saved = commentRepository.save(Comment.builder().text(request.getText()).user(user).issue(issue).build());

        return CommentResponse.builder()
                .id(saved.getId()).text(saved.getText())
                .createdAt(saved.getCreatedAt()).userId(user.getId()).userName(user.getName())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public IssueResponse findMostRecentResolvedIssue(String userEmail) {
        User user = findUserByEmail(userEmail);
        return issueRepository.findTopByCreatedByAndStatusOrderByCreatedAtDesc(user, IssueStatus.RESOLVED)
                .map(this::mapToResponse).orElse(null);
    }

    private void ensureZoneSet(Issue issue) {
        if (issue.getZone() == null || issue.getZone() == com.civic.issue.enums.Zone.UNASSIGNED) {
            issue.setZone(zoneDetector.detectZone(issue.getLatitude(), issue.getLongitude()));
            issueRepository.save(issue);
        }
    }

    private void checkZonePermission(Issue issue, User currentUser) {
        if (currentUser.getRole() == RoleType.ADMIN) return;
        if (issue.getZone() != null && issue.getZone() == currentUser.getZone()) return;
        throw new UnauthorizedException("Access denied for zone: " + (issue.getZone()));
    }

    private void notifyZoneAdmin(Issue issue, String message) {
        // 1. Notify all Regional Admins in that zone
        if (issue.getZone() != null && issue.getZone() != com.civic.issue.enums.Zone.UNASSIGNED) {
            userRepository.findAllByRoleAndZone(RoleType.REGIONAL_ADMIN, issue.getZone())
                    .forEach(admin -> notify(admin, message, issue.getId()));
        }
        
        // 2. Also notify System Admins for visibility
        userRepository.findByRole(RoleType.ADMIN)
                .forEach(admin -> notify(admin, "[Zone Alert] " + message, issue.getId()));
    }

    private void notify(User user, String message, Long issueId) {
        notificationRepository.save(Notification.builder()
                .message(message)
                .user(user)
                .issueId(issueId)
                .build());
    }

    private IssueResponse mapToResponse(Issue issue) {
        List<CommentResponse> comments = issue.getComments() == null ? List.of() :
            issue.getComments().stream().map(c -> CommentResponse.builder()
                    .id(c.getId()).text(c.getText()).createdAt(c.getCreatedAt())
                    .userId(c.getUser().getId()).userName(c.getUser().getName()).build()).toList();

        return IssueResponse.builder()
                .id(issue.getId()).title(issue.getTitle()).description(issue.getDescription())
                .category(issue.getCategory()).status(issue.getStatus()).imageUrl(issue.getImageUrl())
                .resolvedImageUrl(issue.getResolvedImageUrl()).reopenNote(issue.getReopenNote())
                .latitude(issue.getLatitude()).longitude(issue.getLongitude()).zone(issue.getZone())
                .createdAt(issue.getCreatedAt())
                .resolvedAt(issue.getResolvedAt())
                .closedAt(issue.getClosedAt())
                .upvoteCount(issue.getUpvoteCount() != null ? issue.getUpvoteCount() : 0)
                .priorityScore(issue.getPriorityScore() != null ? issue.getPriorityScore() : 0.0)
                .createdBy(issue.getCreatedBy() == null ? null :
                        IssueResponse.UserSummary.builder()
                                .id(issue.getCreatedBy().getId())
                                .name(issue.getCreatedBy().getName())
                                .email(issue.getCreatedBy().getEmail()).build())
                .assignedTo(issue.getAssignedTo() == null ? null :
                        IssueResponse.UserSummary.builder()
                                .id(issue.getAssignedTo().getId())
                                .name(issue.getAssignedTo().getName())
                                .email(issue.getAssignedTo().getEmail()).build())
                .comments(comments).build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private Issue findIssueById(Long id) {
        return issueRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Issue", id));
    }
}
