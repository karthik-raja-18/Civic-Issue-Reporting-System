package com.civic.issue.service;

import com.civic.issue.dto.request.CommentRequest;
import com.civic.issue.dto.request.IssueRequest;
import com.civic.issue.dto.request.UpdateStatusRequest;
import com.civic.issue.dto.response.CommentResponse;
import com.civic.issue.dto.response.IssueResponse;

import java.util.List;

public interface IssueService {
    IssueResponse createIssue(IssueRequest request, String userEmail);
    List<IssueResponse> getAllIssues();
    List<IssueResponse> getMyIssues(String userEmail);
    IssueResponse getIssueById(Long id);
    IssueResponse updateIssueStatus(Long id, UpdateStatusRequest request, String userEmail);
    void deleteIssue(Long id);
    CommentResponse addComment(Long issueId, CommentRequest request, String userEmail);
}
