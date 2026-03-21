package com.civic.issue.dto.response;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AnalyticsResponse {

    private Totals              totals;
    private Map<String,Integer> byStatus;
    private List<ZoneStat>      byZone;
    private List<CategoryStat>  byCategory;
    private List<ResolutionStat>resolutionByZone;
    private List<DailyPoint>    dailyTrend;
    private List<MonthlyPoint>  monthlyTrend;
    private Map<String,Integer> slaBreachesByZone;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Totals {
        private int    total;
        private int    open;
        private int    closed;
        private int    resolved;
        private int    resolvedMonth;
        private Double avgResolutionDays;
        private int    slaBreaches;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ZoneStat {
        private String zone;
        private String adminName;
        private int    total;
        private int    open;
        private int    closed;
        private int    pending;
        private int    inProgress;
        private int    resolved;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryStat {
        private String category;
        private int    count;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ResolutionStat {
        private String zone;
        private Double avgDays;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailyPoint {
        private String date;
        private int    submitted;
        private int    resolved;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyPoint {
        private String month;
        private int    submitted;
        private int    resolved;
    }
}
