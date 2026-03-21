package com.civic.issue.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ZonePerformanceResponse {

    private List<ZoneStat>       zones;
    private List<SlaBreachItem>  slaBreaches;
    private OverallTotals        totals;
    private List<CategoryCount>  topCategories;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ZoneStat {
        private String  zone;
        private String  adminName;
        private int     total;
        private int     open;
        private int     pending;
        private int     inProgress;
        private int     resolved;
        private int     closed;
        private int     resolvedMonth;
        private Double  avgResolutionDays; // null if no closed issues
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SlaBreachItem {
        private Long   issueId;
        private String title;
        private String zone;
        private String category;
        private long   daysPending;
        private String status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OverallTotals {
        private int    total;
        private int    open;
        private int    resolvedMonth;
        private Double avgResolutionDays;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryCount {
        private String category;
        private int    count;
    }
}
