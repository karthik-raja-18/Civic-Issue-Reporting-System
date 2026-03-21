package com.civic.issue.security;

import com.civic.issue.entity.User;
import com.civic.issue.repository.UserRepository;
import com.civic.issue.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Called after successful Google or GitHub OAuth2 login.
 * Generates a JWT and redirects to the React frontend.
 *
 * Flow:
 *   Provider → /oauth2/callback/{provider}
 *   → Spring processes → this handler
 *   → redirect to http://localhost:5173/oauth2/redirect?token=XXX&...
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil            jwtUtil;
    private final UserRepository      userRepository;
    private final UserDetailsService userDetailsService;

    @Value("${app.oauth2.authorized-redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String authorizedRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                         HttpServletResponse response,
                                         Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // ── Get email — normalised by CustomOAuth2UserService ─────────────────
        String rawEmail = (String) oAuth2User.getAttribute("_email");
        if (rawEmail == null) {
            rawEmail = (String) oAuth2User.getAttribute("email");
        }
        final String email = rawEmail;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "User not found after OAuth success: " + email));

        var userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails);

        log.info("OAuth2 success — JWT issued for: {} ({})", email, user.getRole());

        String redirectUrl = UriComponentsBuilder
                .fromUriString(authorizedRedirectUri)
                .queryParam("token",  token)
                .queryParam("userId", user.getId())
                .queryParam("name",
                        URLEncoder.encode(user.getName(), StandardCharsets.UTF_8))
                .queryParam("email",  user.getEmail())
                .queryParam("role",   user.getRole().name())
                .queryParam("avatar",
                        user.getAvatarUrl() != null
                                ? URLEncoder.encode(user.getAvatarUrl(), StandardCharsets.UTF_8)
                                : "")
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
