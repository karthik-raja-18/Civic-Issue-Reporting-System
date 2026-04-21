package com.civic.issue.service;

import java.util.Map;

public interface UpvoteService {
    Map<String, Object> toggleUpvote(Long issueId, String userEmail, Double lat, Double lng);
    boolean hasUpvoted(Long issueId, String userEmail);
}
