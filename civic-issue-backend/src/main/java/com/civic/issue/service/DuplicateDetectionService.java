package com.civic.issue.service;

import com.civic.issue.entity.Issue;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Detects duplicate civic issue reports using:
 *  1. GPS proximity (Haversine formula) — within 100 metres
 *  2. Same category
 *  3. Submitted within last 30 days
 *  4. Not already CLOSED
 *
 * No external API — pure Java math + one DB query.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DuplicateDetectionService {

    private final IssueRepository issueRepository;

    /** Radius in metres within which two issues are considered duplicates */
    private static final double DUPLICATE_RADIUS_METRES = 100.0;

    /** Look back this many days when checking for duplicates */
    private static final int LOOKBACK_DAYS = 30;

    /**
     * Check if a nearby issue of the same category already exists.
     *
     * @return Optional with the nearest duplicate issue, or empty if none found
     */
    public Optional<Issue> findNearbyDuplicate(Double latitude, Double longitude, String category) {
        if (latitude == null || longitude == null) return Optional.empty();

        LocalDateTime since = LocalDateTime.now().minusDays(LOOKBACK_DAYS);

        // Fetch recent non-closed issues of the same category
        // Use a bounding box first (cheap DB filter), then exact Haversine check
        double latRange = DUPLICATE_RADIUS_METRES / 111_000.0;            // ~0.0009 degrees
        double lngRange = DUPLICATE_RADIUS_METRES / (111_000.0 * Math.cos(Math.toRadians(latitude)));

        List<Issue> candidates = issueRepository.findCandidateDuplicates(
                category,
                latitude  - latRange, latitude  + latRange,
                longitude - lngRange, longitude + lngRange,
                since
        );

        // Now apply exact Haversine distance check
        return candidates.stream()
                .filter(issue -> issue.getStatus() != IssueStatus.CLOSED)
                .filter(issue -> issue.getLatitude()  != null && issue.getLongitude() != null)
                .filter(issue -> {
                    double dist = haversineMetres(
                            latitude, longitude,
                            issue.getLatitude(), issue.getLongitude());
                    return dist <= DUPLICATE_RADIUS_METRES;
                })
                .findFirst();
    }

    /**
     * Haversine formula — calculates distance in metres between two GPS coordinates.
     * Pure Java math — no external API.
     */
    public static double haversineMetres(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6_371_000; // Earth radius in metres
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
