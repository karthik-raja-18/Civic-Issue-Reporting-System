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
import com.civic.issue.exception.ResourceNotFoundException;
import com.civic.issue.repository.CommentRepository;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.NotificationRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.IssueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public IssueResponse createIssue(IssueRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .createdBy(user)
                .build();

        Issue saved = issueRepository.save(issue);
        log.info("Issue created with id: {} by user: {}", saved.getId(), userEmail);
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
        Issue issue = findIssueById(id);
        return mapToResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request) {
        Issue issue = findIssueById(id);
        issue.setStatus(request.getStatus());
        Issue updated = issueRepository.save(issue);

        // Create notification for issue owner
        String notificationMessage = String.format(
                "Your issue '%s' status has been updated to %s.",
                issue.getTitle(), request.getStatus().name()
        );
        Notification notification = Notification.builder()
                .message(notificationMessage)
                .user(issue.getCreatedBy())
                .build();
        notificationRepository.save(notification);

        log.info("Issue {} status updated to {} — notification sent to user {}",
                id, request.getStatus(), issue.getCreatedBy().getEmail());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteIssue(Long id) {
        Issue issue = findIssueById(id);
        issueRepository.delete(issue);
        log.info("Issue {} deleted", id);
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long issueId, CommentRequest request, String userEmail) {
        User user = findUserByEmail(userEmail);
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

    // ─── Mapping Helpers ─────────────────────────────────────────────────────────

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

    // ─── Finders ─────────────────────────────────────────────────────────────────

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private Issue findIssueById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue", id));
    }
}
