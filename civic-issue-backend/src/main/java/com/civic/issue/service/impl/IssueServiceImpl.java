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
    private final ZoneDetector           zoneDetector;   // ✅ NEW

    @Override
    @Transactional
    public IssueResponse createIssue(IssueRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);

        // ✅ NEW — Detect Coimbatore zone from coordinates
        Zone detectedZone = zoneDetector.detectZone(
                request.getLatitude(), request.getLongitude());

        // ✅ NEW — Find regional admin for this zone
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
                .zone(detectedZone)                                    // ✅ NEW
                .assignedTo(regionalAdmin.orElse(null))                // ✅ NEW
                .build();

        Issue saved = issueRepository.save(issue);

        // ✅ NEW — Log zone assignment result
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

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request) {
        Issue issue = findIssueById(id);
        issue.setStatus(request.getStatus());
        Issue updated = issueRepository.save(issue);

        // Notify the issue owner
        String msg = String.format(
                "Your issue '%s' status has been updated to %s.",
                issue.getTitle(), request.getStatus().name());

        notificationRepository.save(Notification.builder()
                .message(msg)
                .user(issue.getCreatedBy())
                .build());

        log.info("Issue #{} status → {} | owner notified: {}",
                id, request.getStatus(), issue.getCreatedBy().getEmail());

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
