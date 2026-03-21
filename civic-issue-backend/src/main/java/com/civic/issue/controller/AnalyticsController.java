package com.civic.issue.controller;

import com.civic.issue.dto.AnalyticsResponse;
import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.entity.User;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAdminAnalytics() {
        AnalyticsResponse data = analyticsService.getAdminAnalytics();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/regional")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getRegionalAnalytics() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        AnalyticsResponse data = analyticsService.getRegionalAnalytics(user.getZone());
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
