package com.civic.issue.service;

import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsNotificationService {

    private static final Logger log = LoggerFactory.getLogger(SmsNotificationService.class);
    private final TwilioService twilioService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public SmsNotificationService(TwilioService twilioService) {
        this.twilioService = twilioService;
    }

    public void notifyIssueSubmitted(Issue issue) {
        User reporter = issue.getCreatedBy();
        if (noPhone(reporter)) return;

        String msg = String.format(
            "✅ *CivicPulse*: Your issue #%d '%s' has been submitted successfully.\n" +
            "Track here: %s/issues/%d\n" +
            "We will notify you when an admin starts work.",
            issue.getId(), truncate(issue.getTitle()), frontendUrl, issue.getId()
        );
        sendToUser(reporter, msg);
    }

    public void notifyInProgress(Issue issue) {
        User reporter = issue.getCreatedBy();
        if (noPhone(reporter)) return;

        String adminName = issue.getAssignedTo() != null ? issue.getAssignedTo().getName() : "Zone Admin";
        String msg = String.format(
            "🔧 *CivicPulse Update*: Issue #%d '%s' is now *IN PROGRESS*.\n" +
            "%s has started working on it.\n" +
            "Track: %s/issues/%d",
            issue.getId(), truncate(issue.getTitle()), adminName, frontendUrl, issue.getId()
        );
        sendToUser(reporter, msg);
    }

    public void notifyResolved(Issue issue) {
        User reporter = issue.getCreatedBy();
        if (noPhone(reporter)) return;

        String msg = String.format(
            "🏁 *CivicPulse*: Issue #%d '%s' is now *RESOLVED*.\n" +
            "Please verify the fix:\n" +
            "%s/issues/%d\n\n" +
            "Reply *YES* to confirm fixed, or *NO* to reopen.",
            issue.getId(), truncate(issue.getTitle()), frontendUrl, issue.getId()
        );
        sendToUser(reporter, msg);
    }

    public void notifyClosed(Issue issue) {
        User reporter = issue.getCreatedBy();
        if (noPhone(reporter)) return;

        String msg = String.format(
            "✅ *CivicPulse*: Issue #%d '%s' is now *CLOSED*.\n" +
            "Thank you for helping improve Coimbatore!\n" +
            "Report another: %s",
            issue.getId(), truncate(issue.getTitle()), frontendUrl
        );
        sendToUser(reporter, msg);
    }

    public void notifyAdminReopened(Issue issue) {
        User admin = issue.getAssignedTo();
        if (noPhone(admin)) return;

        String note = (issue.getReopenNote() != null && !issue.getReopenNote().isBlank())
                ? "\nNote: \"" + truncate(issue.getReopenNote()) + "\""
                : "";

        String msg = String.format(
            "⚠️ *CivicPulse*: Issue #%d was *REOPENED* by reporter.%s\n" +
            "View: %s/issues/%d",
            issue.getId(), truncate(issue.getTitle()), note, frontendUrl, issue.getId()
        );
        sendToUser(admin, msg);
    }

    public void notifyAdminNewIssue(Issue issue) {
        User admin = issue.getAssignedTo();
        if (noPhone(admin)) return;

        String msg = String.format(
            "🆕 *CivicPulse*: New %s issue #%d in your zone.\n" +
            "'%s'\n" +
            "View: %s/admin",
            issue.getCategory(), issue.getId(), truncate(issue.getTitle()), frontendUrl
        );
        sendToUser(admin, msg);
    }

    private void sendToUser(User user, String message) {
        // Detect if user created account via WhatsApp
        boolean isWhatsAppUser = user.getEmail() != null && user.getEmail().endsWith("@whatsapp.bot");
        
        if (isWhatsAppUser) {
            twilioService.sendWhatsApp(user.getPhone(), message);
        } else {
            twilioService.sendSms(user.getPhone(), message);
        }
    }

    private boolean noPhone(User user) {
        return user == null || user.getPhone() == null || user.getPhone().isBlank();
    }

    private String truncate(String s) {
        if (s == null) return "";
        return s.length() > 40 ? s.substring(0, 37) + "..." : s;
    }

    public String handleSmsReply(String fromPhone, String body, 
                               com.civic.issue.repository.IssueRepository issueRepo, 
                               com.civic.issue.repository.UserRepository userRepo, 
                               com.civic.issue.service.IssueService issueService) {
        String cleaned = body.trim().toUpperCase();
        User user = userRepo.findByPhone(fromPhone).orElse(null);
        if (user == null) return "CivicPulse: Account not found.";

        Issue resolvedIssue = issueRepo.findTopByCreatedByAndStatusOrderByCreatedAtDesc(
                user, com.civic.issue.enums.IssueStatus.RESOLVED).orElse(null);

        if (resolvedIssue == null) return "CivicPulse: No pending resolutions.";

        try {
            if ("YES".equalsIgnoreCase(cleaned) || "Y".equalsIgnoreCase(cleaned)) {
                issueService.confirmResolution(resolvedIssue.getId(), user.getEmail());
                return "✅ Confirmed. Issue closed. Thank you!";
            } else if ("NO".equalsIgnoreCase(cleaned) || "N".equalsIgnoreCase(cleaned)) {
                com.civic.issue.dto.request.ReopenIssueRequest req = new com.civic.issue.dto.request.ReopenIssueRequest();
                req.setNote("User rejected fix via reply.");
                issueService.reopenIssue(resolvedIssue.getId(), req, user.getEmail());
                return "↩ Reopened. Admin notified.";
            }
            return "Reply YES or NO.";
        } catch (Exception e) {
            return "Operation failed. Visit site.";
        }
    }
}
