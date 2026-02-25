package com.civic.issue.service;

import com.civic.issue.enums.Zone;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Detects the Coimbatore District zone from GPS coordinates.
 *
 * Full district coverage:
 *  NORTH  — Mettupalayam, Annur, Karamadai, Thudiyalur, Saravanampatti
 *  SOUTH  — Pollachi, Valparai, Anaimalai, Kinathukadavu, Aliyar Dam
 *  EAST   — Sulur, Palladam, Avinashi border, Tiruppur border
 *  WEST   — Madukkarai, Thondamuthur, Coimbatore West
 *  CENTRAL— Gandhipuram, RS Puram, Peelamedu, Singanallur, Ukkadam
 *
 * District bounds: lat 10.25–11.35, lng 76.65–77.45
 */
@Slf4j
@Service
public class ZoneDetector {

    // ── Coimbatore District outer boundaries ──────────────────────────────────
    private static final double DISTRICT_LAT_MIN =  10.25;
    private static final double DISTRICT_LAT_MAX =  11.35;
    private static final double DISTRICT_LNG_MIN =  76.65;
    private static final double DISTRICT_LNG_MAX =  77.45;

    // ── Zone boundary thresholds ──────────────────────────────────────────────
    // NORTH: lat > 11.05 — covers Mettupalayam, Annur, Karamadai, Thudiyalur
    private static final double NORTH_LAT_THRESHOLD = 11.05;

    // SOUTH: lat < 10.85 — covers Pollachi, Valparai, Anaimalai, Kinathukadavu
    private static final double SOUTH_LAT_THRESHOLD = 10.85;

    // EAST: lng > 77.10 — covers Sulur, Palladam, Avinashi, Tiruppur border
    private static final double EAST_LNG_THRESHOLD  = 77.10;

    // WEST: lng < 76.95 — covers Madukkarai, Thondamuthur
    private static final double WEST_LNG_THRESHOLD  = 76.95;

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Detect zone from GPS coordinates.
     *
     * @param latitude  GPS latitude (can be null)
     * @param longitude GPS longitude (can be null)
     * @return Zone enum value
     */
    public Zone detectZone(Double latitude, Double longitude) {
        // No coordinates provided
        if (latitude == null || longitude == null) {
            log.debug("No coordinates — zone set to UNASSIGNED");
            return Zone.UNASSIGNED;
        }

        // Outside Coimbatore District entirely
        if (latitude  < DISTRICT_LAT_MIN || latitude  > DISTRICT_LAT_MAX ||
            longitude < DISTRICT_LNG_MIN || longitude > DISTRICT_LNG_MAX) {
            log.debug("Coordinates ({}, {}) outside Coimbatore District", latitude, longitude);
            return Zone.UNASSIGNED;
        }

        // ── NORTH Zone ────────────────────────────────────────────────────────
        // Mettupalayam (11.29°N), Annur (11.19°N),
        // Karamadai (11.24°N), Thudiyalur (11.11°N), Saravanampatti (11.07°N)
        if (latitude > NORTH_LAT_THRESHOLD) {
            log.debug("Zone NORTH detected for ({}, {})", latitude, longitude);
            return Zone.NORTH;
        }

        // ── SOUTH Zone ────────────────────────────────────────────────────────
        // Pollachi (10.59°N), Valparai (10.32°N), Anaimalai (10.57°N),
        // Kinathukadavu (10.79°N), Aliyar Dam (10.48°N)
        if (latitude < SOUTH_LAT_THRESHOLD) {
            log.debug("Zone SOUTH detected for ({}, {})", latitude, longitude);
            return Zone.SOUTH;
        }

        // From here lat is between 10.85 and 11.05 — main city belt

        // ── EAST Zone ─────────────────────────────────────────────────────────
        // Sulur (10.99°N, 77.13°E), Palladam (10.98°N, 77.28°E),
        // Avinashi border (77.26°E), Tiruppur border (77.34°E)
        if (longitude > EAST_LNG_THRESHOLD) {
            log.debug("Zone EAST detected for ({}, {})", latitude, longitude);
            return Zone.EAST;
        }

        // ── WEST Zone ─────────────────────────────────────────────────────────
        // Madukkarai (10.91°N, 76.90°E), Thondamuthur (11.02°N, 76.83°E)
        if (longitude < WEST_LNG_THRESHOLD) {
            log.debug("Zone WEST detected for ({}, {})", latitude, longitude);
            return Zone.WEST;
        }

        // ── CENTRAL Zone ──────────────────────────────────────────────────────
        // Gandhipuram (11.016°N, 76.955°E), RS Puram (11.006°N, 76.960°E)
        // Peelamedu (11.027°N, 77.034°E), Singanallur (10.993°N, 77.027°E)
        // Ukkadam (10.998°N, 76.955°E), Race Course (11.012°N, 76.968°E)
        log.debug("Zone CENTRAL detected for ({}, {})", latitude, longitude);
        return Zone.CENTRAL;
    }

    /**
     * Human-readable description of each zone.
     */
    public String getZoneDescription(Zone zone) {
        return switch (zone) {
            case NORTH     -> "North Zone — Mettupalayam, Annur, Karamadai, Thudiyalur, Saravanampatti";
            case SOUTH     -> "South Zone — Pollachi, Valparai, Anaimalai, Kinathukadavu, Aliyar Dam";
            case EAST      -> "East Zone — Sulur, Palladam, Avinashi Road, Tiruppur Border";
            case WEST      -> "West Zone — Madukkarai, Thondamuthur, Coimbatore West";
            case CENTRAL   -> "Central Zone — Gandhipuram, RS Puram, Peelamedu, Singanallur, Ukkadam";
            case UNASSIGNED-> "Unassigned — Outside Coimbatore District or no coordinates";
        };
    }
}
