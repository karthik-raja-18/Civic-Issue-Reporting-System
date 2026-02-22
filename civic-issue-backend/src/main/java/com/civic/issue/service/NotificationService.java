package com.civic.issue.service;

import com.civic.issue.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(String userEmail);
}
