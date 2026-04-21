package com.civic.issue.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TwilioService {

    private static final Logger log = LoggerFactory.getLogger(TwilioService.class);

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.whatsapp.from}")
    private String whatsappFrom;

    @Value("${twilio.sms.from}")
    private String smsFrom;

    @PostConstruct
    public void init() {
        if (accountSid == null || accountSid.contains("${")) {
            log.error("❌ TWILIO ERROR: Account SID not loaded from environment variables!");
        } else {
            Twilio.init(accountSid, authToken);
            log.info("✅ Twilio Initialized — WhatsApp From: {}", whatsappFrom);
        }
    }

    public void sendWhatsApp(String toPhone, String body) {
        log.debug("Attempting to send WhatsApp message to: {}", toPhone);
        try {
            Message msg = Message.creator(
                    new PhoneNumber("whatsapp:" + toPhone),
                    new PhoneNumber(whatsappFrom),
                    body
            ).create();
            log.info("🚀 WhatsApp SENT successfully to {} | SID: {}", toPhone, msg.getSid());
        } catch (Exception e) {
            log.error("❌ WhatsApp SEND FAILED to {}: {}", toPhone, e.getMessage());
        }
    }

    public void sendSms(String toPhone, String body) {
        try {
            Message msg = Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(smsFrom),
                    body
            ).create();
            log.info("🚀 SMS SENT successfully to {} | SID: {}", toPhone, msg.getSid());
        } catch (Exception e) {
            log.error("❌ SMS SEND FAILED to {}: {}", toPhone, e.getMessage());
        }
    }

    public void notify(String phone, boolean hasWhatsApp, String message) {
        if (phone == null || phone.isBlank()) return;
        if (hasWhatsApp) sendWhatsApp(phone, message);
        else             sendSms(phone, message);
    }
}
