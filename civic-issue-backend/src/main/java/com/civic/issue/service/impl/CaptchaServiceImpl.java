package com.civic.issue.service.impl;

import com.civic.issue.service.CaptchaService;
import org.springframework.stereotype.Service;

@Service
public class CaptchaServiceImpl implements CaptchaService {
    @Override
    public boolean verify(String token) {
        // Simplified for now - always returns true for development
        // In production, this would call Google reCAPTCHA API
        return token != null && !token.isBlank();
    }
}
