package com.civic.issue.dto;

import java.util.List;

public class AnalyticsResponse {
    
    private long totalIssues;
    private long openIssues;
    private long closedIssues;
    private double avgResolutionDays;
    private long slaBreaches;
    private long issuesThisMonth;

    private List<DailyTrend> dailyTrends;
    private List<StatusCount> statusBreakdown;
    private List<ZoneStat> zoneStats;
    private List<CategoryStat> topCategories;
    private List<MonthlyTrend> monthlyTrends;

    public AnalyticsResponse() {}

    public AnalyticsResponse(long totalIssues, long openIssues, long closedIssues, double avgResolutionDays, 
                             long slaBreaches, long issuesThisMonth, List<DailyTrend> dailyTrends, 
                             List<StatusCount> statusBreakdown, List<ZoneStat> zoneStats, 
                             List<CategoryStat> topCategories, List<MonthlyTrend> monthlyTrends) {
        this.totalIssues = totalIssues;
        this.openIssues = openIssues;
        this.closedIssues = closedIssues;
        this.avgResolutionDays = avgResolutionDays;
        this.slaBreaches = slaBreaches;
        this.issuesThisMonth = issuesThisMonth;
        this.dailyTrends = dailyTrends;
        this.statusBreakdown = statusBreakdown;
        this.zoneStats = zoneStats;
        this.topCategories = topCategories;
        this.monthlyTrends = monthlyTrends;
    }

    // Getters and Setters
    public long getTotalIssues() { return totalIssues; }
    public void setTotalIssues(long totalIssues) { this.totalIssues = totalIssues; }
    public long getOpenIssues() { return openIssues; }
    public void setOpenIssues(long openIssues) { this.openIssues = openIssues; }
    public long getClosedIssues() { return closedIssues; }
    public void setClosedIssues(long closedIssues) { this.closedIssues = closedIssues; }
    public double getAvgResolutionDays() { return avgResolutionDays; }
    public void setAvgResolutionDays(double avgResolutionDays) { this.avgResolutionDays = avgResolutionDays; }
    public long getSlaBreaches() { return slaBreaches; }
    public void setSlaBreaches(long slaBreaches) { this.slaBreaches = slaBreaches; }
    public long getIssuesThisMonth() { return issuesThisMonth; }
    public void setIssuesThisMonth(long issuesThisMonth) { this.issuesThisMonth = issuesThisMonth; }
    public List<DailyTrend> getDailyTrends() { return dailyTrends; }
    public void setDailyTrends(List<DailyTrend> dailyTrends) { this.dailyTrends = dailyTrends; }
    public List<StatusCount> getStatusBreakdown() { return statusBreakdown; }
    public void setStatusBreakdown(List<StatusCount> statusBreakdown) { this.statusBreakdown = statusBreakdown; }
    public List<ZoneStat> getZoneStats() { return zoneStats; }
    public void setZoneStats(List<ZoneStat> zoneStats) { this.zoneStats = zoneStats; }
    public List<CategoryStat> getTopCategories() { return topCategories; }
    public void setTopCategories(List<CategoryStat> topCategories) { this.topCategories = topCategories; }
    public List<MonthlyTrend> getMonthlyTrends() { return monthlyTrends; }
    public void setMonthlyTrends(List<MonthlyTrend> monthlyTrends) { this.monthlyTrends = monthlyTrends; }

    public static class DailyTrend {
        private String date;
        private long submitted;
        private long resolved;

        public DailyTrend() {}
        public DailyTrend(String date, long submitted, long resolved) {
            this.date = date;
            this.submitted = submitted;
            this.resolved = resolved;
        }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public long getSubmitted() { return submitted; }
        public void setSubmitted(long submitted) { this.submitted = submitted; }
        public long getResolved() { return resolved; }
        public void setResolved(long resolved) { this.resolved = resolved; }
    }

    public static class StatusCount {
        private String status;
        private long count;

        public StatusCount() {}
        public StatusCount(String status, long count) {
            this.status = status;
            this.count = count;
        }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class ZoneStat {
        private String zone;
        private String adminName;
        private long total;
        private long open;
        private long closed;
        private double avgDays;
        private long breaches;

        public ZoneStat() {}
        public ZoneStat(String zone, String adminName, long total, long open, long closed, double avgDays, long breaches) {
            this.zone = zone;
            this.adminName = adminName;
            this.total = total;
            this.open = open;
            this.closed = closed;
            this.avgDays = avgDays;
            this.breaches = breaches;
        }
        public String getZone() { return zone; }
        public void setZone(String zone) { this.zone = zone; }
        public String getAdminName() { return adminName; }
        public void setAdminName(String adminName) { this.adminName = adminName; }
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getOpen() { return open; }
        public void setOpen(long open) { this.open = open; }
        public long getClosed() { return closed; }
        public void setClosed(long closed) { this.closed = closed; }
        public double getAvgDays() { return avgDays; }
        public void setAvgDays(double avgDays) { this.avgDays = avgDays; }
        public long getBreaches() { return breaches; }
        public void setBreaches(long breaches) { this.breaches = breaches; }
    }

    public static class CategoryStat {
        private String category;
        private long count;

        public CategoryStat() {}
        public CategoryStat(String category, long count) {
            this.category = category;
            this.count = count;
        }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class MonthlyTrend {
        private String month;
        private long submitted;
        private long resolved;

        public MonthlyTrend() {}
        public MonthlyTrend(String month, long submitted, long resolved) {
            this.month = month;
            this.submitted = submitted;
            this.resolved = resolved;
        }
        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }
        public long getSubmitted() { return submitted; }
        public void setSubmitted(long submitted) { this.submitted = submitted; }
        public long getResolved() { return resolved; }
        public void setResolved(long resolved) { this.resolved = resolved; }
    }
}
