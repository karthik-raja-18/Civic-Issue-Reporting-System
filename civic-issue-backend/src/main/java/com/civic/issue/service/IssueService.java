package com.civic.issue.service;

import com.civic.issue.dto.request.*;
import com.civic.issue.dto.response.CommentResponse;
import com.civic.issue.dto.response.IssueResponse;

import java.util.List;

public interface IssueService {

    IssueResponse createIssue(IssueRequest request, String userEmail);

    List<IssueResponse> getAllIssues();

    List<IssueResponse> getMyIssues(String userEmail);

    IssueResponse getIssueById(Long id);

    IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request, String userEmail);

    // ✅ Admin/Zone Admin marks issue resolved + uploads proof photo
    IssueResponse resolveIssue(Long id, ResolveIssueRequest request, String userEmail);

    // ✅ Reporter confirms the fix is done → CLOSED
    IssueResponse confirmResolution(Long id, String userEmail);

    // ✅ Reporter says not fixed → REOPENED, admin notified
    IssueResponse reopenIssue(Long id, ReopenIssueRequest request, String userEmail);

    void deleteIssue(Long id);

    CommentResponse addComment(Long issueId, CommentRequest request, String userEmail);
}
