package com.civic.issue.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Slf4j
@Service
public class CaptchaService {

    @Value("${recaptcha.secret.key:NOTSET}")
    private String secretKey;

    public boolean verify(String token) {
        try {
            // ✅ If key not configured — skip verification in dev mode
            if (secretKey == null || secretKey.isBlank()
                    || secretKey.equals("NOTSET")
                    || secretKey.equals("YOUR_SECRET_KEY_HERE")
                    || secretKey.equals("6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe")) {
                log.warn("reCAPTCHA secret key not configured or using test key — skipping verification");
                return true;
            }

            // ✅ WhatsApp bot bypass
            if ("WHATSAPP_BOT_BYPASS".equals(token)) return true;

            if (token == null || token.isBlank()) {
                log.warn("Empty CAPTCHA token received");
                return false;
            }

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret",   secretKey);
            params.add("response", token);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = new RestTemplate()
                    .postForObject(
                        "https://www.google.com/recaptcha/api/siteverify",
                        params, Map.class);

            boolean success = Boolean.TRUE.equals(
                    response != null ? response.get("success") : false);
            log.info("CAPTCHA verify result: {}", success);
            return success;
        } catch (Exception e) {
            log.error("CAPTCHA verify error — allowing submission: {}", e.getMessage());
            return true; // ✅ Fail open — don't block users on network error
        }
    }
}