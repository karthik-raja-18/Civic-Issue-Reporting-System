package com.civic.issue.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Called if OAuth2 login fails (e.g. account not found).
 * Redirects to the frontend with an error code.
 */
@Component
public class OAuth2AuthenticationFailureHandler 
        extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.oauth2.failure-redirect-uri:http://localhost:3000/login}")
    private String failureRedirectUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                         HttpServletResponse response,
                                         AuthenticationException exception) throws IOException {

        String errorCode = exception.getMessage();
        String action    = (String) request.getSession().getAttribute("oauth_action");
        
        // Default to login page, but we can refine based on action
        String baseUri = failureRedirectUri;
        if ("register".equalsIgnoreCase(action) && !"account_already_exists".equals(errorCode)) {
            baseUri = "http://localhost:3000/register";
        }

        String targetUrl = UriComponentsBuilder
                .fromUriString(baseUri)
                .queryParam("error", errorCode)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
