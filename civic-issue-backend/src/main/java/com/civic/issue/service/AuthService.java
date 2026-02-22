package com.civic.issue.service;

import com.civic.issue.dto.request.LoginRequest;
import com.civic.issue.dto.request.RegisterRequest;
import com.civic.issue.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
