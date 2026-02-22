package com.civic.issue.controller;

import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.dto.response.NotificationResponse;
import com.civic.issue.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications
     * Fetch all notifications for the currently authenticated user.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<NotificationResponse> notifications =
                notificationService.getMyNotifications(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }
}
