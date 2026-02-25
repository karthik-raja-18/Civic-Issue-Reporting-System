package com.civic.issue.service.impl;

import com.civic.issue.dto.request.CommentRequest;
import com.civic.issue.dto.request.IssueRequest;
import com.civic.issue.dto.request.UpdateStatusRequest;
import com.civic.issue.dto.response.CommentResponse;
import com.civic.issue.dto.response.IssueResponse;
import com.civic.issue.entity.Comment;
import com.civic.issue.entity.Issue;
import com.civic.issue.entity.Notification;
import com.civic.issue.entity.User;
import com.civic.issue.enums.RoleType;
import com.civic.issue.enums.Zone;
import com.civic.issue.exception.ResourceNotFoundException;
import com.civic.issue.exception.UnauthorizedException;
import com.civic.issue.repository.CommentRepository;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.NotificationRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.IssueService;
import com.civic.issue.service.ZoneDetector;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    @Transactional
    public IssueResponse createIssue(IssueRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);

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

        Issue saved = issueRepository.save(issue);

        if (regionalAdmin.isPresent()) {
            log.info("Issue #{} → Zone: {} → Assigned to: {}",
                    saved.getId(), detectedZone, regionalAdmin.get().getEmail());
        } else {
            log.info("Issue #{} → Zone: {} → No regional admin found — UNASSIGNED",
                    saved.getId(), detectedZone);
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getAllIssues() {
        return issueRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getMyIssues(String userEmail) {
        User user = findUserByEmail(userEmail);
        return issueRepository.findByCreatedByOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public IssueResponse getIssueById(Long id) {
        return mapToResponse(findIssueById(id));
    }

    // ✅ UPDATED — now takes userEmail, enforces zone restriction
    @Override
    @Transactional
    public IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request, String userEmail) {
        Issue issue = findIssueById(id);

        User currentUser = findUserByEmail(userEmail);

        if (currentUser.getRole() == RoleType.ADMIN) {
            // ✅ ADMIN — can update ANY issue, no restriction
            issue.setStatus(request.getStatus());
            log.info("Issue #{} status → {} | by ADMIN: {}",
                    id, request.getStatus(), userEmail);

        } else if (currentUser.getRole() == RoleType.REGIONAL_ADMIN) {
            // ✅ REGIONAL_ADMIN — only their zone or directly assigned to them
            boolean isTheirZone     = issue.getZone() != null
                    && issue.getZone() == currentUser.getZone();

            boolean isAssignedToThem = issue.getAssignedTo() != null
                    && issue.getAssignedTo().getId().equals(currentUser.getId());

            if (!isTheirZone && !isAssignedToThem) {
                log.warn("REGIONAL_ADMIN {} tried to update issue #{} outside their zone {}",
                        userEmail, id, currentUser.getZone());
                throw new UnauthorizedException(
                        "You can only update issues in your zone: " + currentUser.getZone());
            }

            issue.setStatus(request.getStatus());
            log.info("Issue #{} status → {} | by REGIONAL_ADMIN: {} (zone: {})",
                    id, request.getStatus(), userEmail, currentUser.getZone());

        } else {
            throw new UnauthorizedException(
                    "You do not have permission to update issue status.");
        }

        Issue updated = issueRepository.save(issue);

        // Notify the issue owner
        String msg = String.format(
                "Your issue '%s' status has been updated to %s.",
                issue.getTitle(), request.getStatus().name());

        notificationRepository.save(Notification.builder()
                .message(msg)
                .user(issue.getCreatedBy())
                .build());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteIssue(Long id) {
        issueRepository.delete(findIssueById(id));
        log.info("Issue #{} deleted", id);
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long issueId,
                                      CommentRequest request,
                                      String userEmail) {
        User user   = findUserByEmail(userEmail);
        Issue issue = findIssueById(issueId);

        Comment comment = Comment.builder()
                .text(request.getText())
                .user(user)
                .issue(issue)
                .build();

        Comment saved = commentRepository.save(comment);

        return CommentResponse.builder()
                .id(saved.getId())
                .text(saved.getText())
                .createdAt(saved.getCreatedAt())
                .userId(user.getId())
                .userName(user.getName())
                .build();
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private IssueResponse mapToResponse(Issue issue) {
        List<CommentResponse> comments = issue.getComments().stream()
                .map(c -> CommentResponse.builder()
                        .id(c.getId())
                        .text(c.getText())
                        .createdAt(c.getCreatedAt())
                        .userId(c.getUser().getId())
                        .userName(c.getUser().getName())
                        .build())
                .toList();

        IssueResponse.UserSummary userSummary = IssueResponse.UserSummary.builder()
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
                .comments(comments)
                .build();
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found: " + email));
    }

    private Issue findIssueById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", id));
    }
}