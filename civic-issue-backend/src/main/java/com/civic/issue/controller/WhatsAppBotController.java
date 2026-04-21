package com.civic.issue.controller;

import com.civic.issue.service.SmsNotificationService;
import com.civic.issue.service.WhatsAppBotService;
import com.civic.issue.repository.IssueRepository;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.service.IssueService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bot")
public class WhatsAppBotController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppBotController.class);

    private final WhatsAppBotService      whatsAppBotService;
    private final SmsNotificationService  smsNotificationService;
    private final IssueRepository         issueRepository;
    private final UserRepository          userRepository;
    private final IssueService            issueService;

    public WhatsAppBotController(
            WhatsAppBotService      whatsAppBotService,
            SmsNotificationService  smsNotificationService,
            IssueRepository         issueRepository,
            UserRepository          userRepository,
            IssueService            issueService) {
        this.whatsAppBotService = whatsAppBotService;
        this.smsNotificationService = smsNotificationService;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.issueService = issueService;
    }

    @PostMapping(value = "/whatsapp",
                 consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> handleWhatsApp(
            @RequestParam("From")                          String from,
            @RequestParam(value = "Body",   defaultValue = "") String body,
            @RequestParam(value = "MediaUrl0",  required = false) String mediaUrl,
            @RequestParam(value = "Latitude",   required = false) Double latitude,
            @RequestParam(value = "Longitude",  required = false) Double longitude) {

        log.info("‼️ WHATSAPP INCOMING -> From: {} | Body: {} | Media: {} | Lat/Lng: {},{}", 
                from, body, mediaUrl != null ? "YES" : "NO", latitude, longitude);

        String phone = from.replace("whatsapp:", "");

        // Run the complex logic in background
        new Thread(() -> {
            try {
                whatsAppBotService.handleIncoming(phone, body, mediaUrl, latitude, longitude);
            } catch (Exception e) {
                log.error("CRITICAL BOT ERROR for {}: {}", phone, e.getMessage(), e);
            }
        }).start();

        // Return a basic TwiML response to tell Twilio we acknowledged it
        // This prevents "Twilio 12400" timeout errors
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response/>");
    }

    @PostMapping(value = "/sms",
                 consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> handleSms(
            @RequestParam("From") String from,
            @RequestParam(value = "Body", defaultValue = "") String body) {

        log.info("📩 SMS INCOMING -> From: {} | Body: {}", from, body);

        String reply = smsNotificationService.handleSmsReply(
                from, body, issueRepository, userRepository, issueService);

        String twiml = String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<Response><Message>%s</Message></Response>",
            escapeXml(reply)
        );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(twiml);
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }
}
