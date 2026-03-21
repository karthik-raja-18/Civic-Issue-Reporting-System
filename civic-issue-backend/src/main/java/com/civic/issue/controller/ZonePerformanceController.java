package com.civic.issue.controller;

import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.dto.response.ZonePerformanceResponse;
import com.civic.issue.service.ZonePerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class ZonePerformanceController {

    private final ZonePerformanceService zonePerformanceService;

    /**
     * GET /api/admin/zone-performance
     * Returns zone stats + SLA breach list for the performance dashboard.
     * ADMIN only.
     */
    @GetMapping("/zone-performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ZonePerformanceResponse>> getZonePerformance() {
        return ResponseEntity.ok(ApiResponse.success(
                zonePerformanceService.getZonePerformance()));
    }
}
