package com.civic.issue.controller;

import com.civic.issue.dto.response.ApiResponse;
import com.civic.issue.service.UpvoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class UpvoteController {

    private final UpvoteService upvoteService;

    /**
     * POST /api/issues/{id}/upvote
     * Toggle upvote on an issue.
     * Requires lat/lng to verify proximity.
     *
     * Body: { "latitude": 11.0168, "longitude": 76.9558 }
     * Returns: { upvoteCount, hasUpvoted, priorityScore }
     */
    @PostMapping("/{id}/upvote")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleUpvote(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Double> location,
            @AuthenticationPrincipal UserDetails userDetails) {

        Double lat = location != null ? location.get("latitude")  : null;
        Double lng = location != null ? location.get("longitude") : null;

        Map<String, Object> result = upvoteService.toggleUpvote(
                id, userDetails.getUsername(), lat, lng);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/issues/{id}/upvote
     * Check if current user has upvoted this issue.
     */
    @GetMapping("/{id}/upvote")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUpvoteStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean hasUpvoted = upvoteService.hasUpvoted(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("hasUpvoted", hasUpvoted)));
    }
}
