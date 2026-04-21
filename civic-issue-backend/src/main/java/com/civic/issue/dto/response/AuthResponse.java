package com.civic.issue.dto.response;

import com.civic.issue.enums.RoleType;

public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long userId;
    private String name;
    private String email;
    private RoleType role;

    public AuthResponse() {}

    public AuthResponse(String token, String type, Long userId, String name, String email, RoleType role) {
        this.token = token;
        this.type = type;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    // Getters
    public String getToken() { return token; }
    public String getType() { return type; }
    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public RoleType getRole() { return role; }

    // Setters
    public void setToken(String token) { this.token = token; }
    public void setType(String type) { this.type = type; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(RoleType role) { this.role = role; }

    // Manual Builder
    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public static class AuthResponseBuilder {
        private AuthResponse res = new AuthResponse();

        public AuthResponseBuilder token(String t) { res.token = t; return this; }
        public AuthResponseBuilder type(String t) { res.type = t; return this; }
        public AuthResponseBuilder userId(Long id) { res.userId = id; return this; }
        public AuthResponseBuilder name(String n) { res.name = n; return this; }
        public AuthResponseBuilder email(String e) { res.email = e; return this; }
        public AuthResponseBuilder role(RoleType r) { res.role = r; return this; }
        public AuthResponse build() { return res; }
    }
}