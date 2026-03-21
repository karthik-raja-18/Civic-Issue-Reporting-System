package com.civic.issue.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    
    // KPI Metrics
    private long totalIssues;
    private long openIssues;
    private long closedIssues;
    private double avgResolutionDays;
    private long slaBreaches;
    private long issuesThisMonth;

    // Charts Data
    private List<DailyTrend> dailyTrends;         // Area Chart
    private List<StatusCount> statusBreakdown;     // Donut Chart
    private List<ZoneStat> zoneStats;             // Grouped Bar & Zone Table
    private List<CategoryStat> topCategories;    // Horizontal Bar
    private List<MonthlyTrend> monthlyTrends;     // Line Chart

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class DailyTrend {
        private String date;
        private long submitted;
        private long resolved;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ZoneStat {
        private String zone;
        private String adminName;
        private long total;
        private long open;
        private long closed;
        private double avgDays;
        private long breaches;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class CategoryStat {
        private String category;
        private long count;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class MonthlyTrend {
        private String month;
        private long submitted;
        private long resolved;
    }
}
