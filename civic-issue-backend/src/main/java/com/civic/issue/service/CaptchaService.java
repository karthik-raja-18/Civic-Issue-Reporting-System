package com.civic.issue.service;

public interface CaptchaService {
    boolean verify(String token);
}
