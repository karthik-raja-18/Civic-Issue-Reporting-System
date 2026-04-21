package com.civic.issue.service;

import com.civic.issue.dto.request.IssueRequest;
import com.civic.issue.dto.request.ReopenIssueRequest;
import com.civic.issue.entity.Issue;
import com.civic.issue.entity.User;
import com.civic.issue.entity.WhatsAppSession;
import com.civic.issue.enums.IssueStatus;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.repository.WhatsAppSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class WhatsAppBotService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppBotService.class);

    private final WhatsAppSessionRepository sessionRepository;
    private final UserRepository            userRepository;
    private final IssueRepository           issueRepository;
    private final IssueService              issueService;
    private final GeminiService             geminiService;
    private final TwilioService             twilioService;
    private final CloudinaryService         cloudinaryService;

    public WhatsAppBotService(
            WhatsAppSessionRepository sessionRepository,
            UserRepository            userRepository,
            IssueRepository           issueRepository,
            IssueService              issueService,
            GeminiService             geminiService,
            TwilioService             twilioService,
            CloudinaryService         cloudinaryService) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
        this.issueService = issueService;
        this.geminiService = geminiService;
        this.twilioService = twilioService;
        this.cloudinaryService = cloudinaryService;
    }

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public void handleIncoming(String phone, String body, String mediaUrl, Double lat, Double lng) {
        String cleanedMsg = body != null ? body.trim().toUpperCase() : "";
        log.info("📞 INCOMING WHATSAPP: from={}, body='{}'", phone, cleanedMsg);

        // ✅ AUTO-FIX NAME: Ensure this user's name is their phone number in the system
        ensurePhoneNumberAsName(phone);

        // 1. Check for YES/NO Reply (Priority)
        if (cleanedMsg.startsWith("YES") || cleanedMsg.startsWith("NO")) {
            handleResolutionReply(phone, cleanedMsg.startsWith("YES") ? "YES" : "NO");
            return;
        }

        WhatsAppSession session = sessionRepository.findByPhone(phone).orElse(new WhatsAppSession(phone));
        String currentState = session.getState() != null ? session.getState() : "IDLE";
        
        // 2. Global Commands
        if ("CANCEL".equals(cleanedMsg)) {
            sessionRepository.delete(session);
            twilioService.sendWhatsApp(phone, "🗑️ Report discarded. Send a photo to start again.");
            return;
        } else if ("CONFIRM".equals(cleanedMsg)) {
            handleConfirm(phone);
            return;
        }

        // 3. Image/Report Logic
        if (mediaUrl != null && !mediaUrl.isEmpty()) {
            handleNewReportInitiation(session, mediaUrl, lat, lng);
            return;
        }

        // 4. State-Aware Processing
        switch (currentState) {
            case "IDLE":
                sendWelcome(phone);
                break;
            case "AWAITING_LOCATION":
                if (lat != null && lng != null) {
                    handleLocationGPS(phone, lat, lng);
                } else {
                    twilioService.sendWhatsApp(phone, "📍 *GPS Location Required*\n\nPlease share your location using the WhatsApp Location button.");
                }
                break;
            case "AWAITING_CONFIRMATION":
                twilioService.sendWhatsApp(phone, "Please reply *CONFIRM* to submit or *CANCEL* to delete.");
                break;
            default:
                sendWelcome(phone);
                break;
        }
    }

    private void ensurePhoneNumberAsName(String phone) {
        userRepository.findByPhone(phone).ifPresent(user -> {
            // Update name to phone number if it's currently a placeholder or different
            if (user.getName() == null || user.getName().contains("Citizen") || user.getName().isEmpty()) {
                user.setName(phone);
                userRepository.save(user);
                log.info("🔄 Updated User Name to Phone: {}", phone);
            }
        });
    }

    private void handleResolutionReply(String phone, String reply) {
        Optional<User> userOpt = userRepository.findByPhone(phone);
        if (userOpt.isEmpty()) {
            twilioService.sendWhatsApp(phone, "User account not found. Please report an issue first.");
            return;
        }
        User user = userOpt.get();

        Optional<Issue> issueOpt = issueRepository.findTopByCreatedByAndStatusOrderByCreatedAtDesc(user, IssueStatus.RESOLVED);
        
        if (issueOpt.isEmpty()) {
            twilioService.sendWhatsApp(phone, "No pending RESOLVED issues found to confirm/reopen.");
            return;
        }
        
        Issue issue = issueOpt.get();
        if ("YES".equals(reply)) {
            issueService.confirmResolution(issue.getId(), user.getEmail());
            twilioService.sendWhatsApp(phone, "✅ *Issue Closed*. Thank you for the confirmation!");
        } else {
            ReopenIssueRequest req = new ReopenIssueRequest();
            req.setNote("Citizen rejected resolution via WhatsApp NO command.");
            issueService.reopenIssue(issue.getId(), req, user.getEmail());
            twilioService.sendWhatsApp(phone, "↩️ *Issue Reopened*. The zone admin has been notified.");
        }
    }

    private void handleNewReportInitiation(WhatsAppSession session, String mediaUrl, Double lat, Double lng) {
        session.setTempImageUrl(mediaUrl);
        session.setTempLatitude(lat);
        session.setTempLongitude(lng);
        session.setState("AWAITING_LOCATION");
        sessionRepository.save(session);

        if (lat != null && lng != null) {
            handleLocationGPS(session.getPhone(), lat, lng);
        } else {
            twilioService.sendWhatsApp(session.getPhone(), "📸 *Photo Received!*\n\nNow please share your *Live GPS Location*.");
        }
    }

    private void sendWelcome(String phone) {
        twilioService.sendWhatsApp(phone, "Welcome! 🏛️\n\nTo report a civic issue:\n1. 📸 Send a *LIVE PHOTO*.\n2. 📍 Send your *GPS LOCATION*.");
    }

    @Transactional
    protected void handleLocationGPS(String phone, Double lat, Double lng) {
        WhatsAppSession session = sessionRepository.findByPhone(phone).orElse(null);
        if (session == null) return;

        session.setTempLatitude(lat);
        session.setTempLongitude(lng);
        sessionRepository.save(session);

        twilioService.sendWhatsApp(phone, "🤖 *AI Verifying details...*");

        try {
            GeminiService.GeminiValidationResult result = geminiService.validateIssuePhoto(session.getTempImageUrl());

            if (!result.isValidImage()) {
                twilioService.sendWhatsApp(phone, "❌ *Reject*: " + result.getRejectionReason());
                sessionRepository.delete(session);
                return;
            }

            session.setTempCategory(result.getSuggestedCategory());
            session.setTempDescription(result.getGeneratedDescription());
            session.setTempTitle(result.getSuggestedCategory() + " identified");
            session.setState("AWAITING_CONFIRMATION");
            sessionRepository.save(session);

            String reportSummary = String.format(
                "✅ *AI Identification*\n\n📋 *Category*: %s\n📝 *Description*: %s\n\nReply *CONFIRM* to publish this report.",
                result.getSuggestedCategory(), result.getGeneratedDescription());
            
            twilioService.sendWhatsApp(phone, reportSummary);
        } catch (Exception e) {
            twilioService.sendWhatsApp(phone, "⚠️ AI busy. Try sending the photo again.");
        }
    }

    private void handleConfirm(String phone) {
        WhatsAppSession session = sessionRepository.findByPhone(phone).orElse(null);
        if (session == null || !"AWAITING_CONFIRMATION".equals(session.getState())) {
            twilioService.sendWhatsApp(phone, "Nothing to confirm! Send a photo of an issue to start.");
            return;
        }

        try {
            String finalImageUrl = cloudinaryService.uploadImage(session.getTempImageUrl());

            User user = userRepository.findByPhone(phone).orElseGet(() -> {
                User newUser = User.builder()
                        .name(phone)
                        .email(phone + "@whatsapp.bot")
                        .phone(phone)
                        .password("whatsapp-user")
                        .role(com.civic.issue.enums.RoleType.USER)
                        .zone(com.civic.issue.enums.Zone.UNASSIGNED)
                        .build();
                return userRepository.save(newUser);
            });

            IssueRequest request = new IssueRequest();
            request.setTitle(session.getTempTitle());
            request.setDescription(session.getTempDescription());
            request.setCategory(session.getTempCategory());
            request.setLatitude(session.getTempLatitude());
            request.setLongitude(session.getTempLongitude());
            request.setImageUrl(finalImageUrl);
            
            issueService.createIssueFromBot(request, user.getEmail());
            
            twilioService.sendWhatsApp(phone, "🚀 *Issue Published!* \n\nTrack: " + frontendUrl + "/dashboard");
            sessionRepository.delete(session);
        } catch (Exception e) {
            log.error("Confirmation error: {}", e.getMessage(), e);
            twilioService.sendWhatsApp(phone, "❌ Failed to submit. Please try again.");
        }
    }
}
