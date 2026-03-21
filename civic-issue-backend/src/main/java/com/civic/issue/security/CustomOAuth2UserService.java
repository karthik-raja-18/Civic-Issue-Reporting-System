package com.civic.issue.security;

import com.civic.issue.entity.User;
import com.civic.issue.enums.RoleType;
import com.civic.issue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {
        
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId();
        OAuthUserInfo info = extractUserInfo(provider, oAuth2User.getAttributes());

        User user = findOrCreateUser(provider, info);

        Map<String, Object> attrs = new HashMap<>(oAuth2User.getAttributes());
        attrs.put("userId", user.getId());
        attrs.put("_email", info.email);

        return new DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                attrs,
                provider.equals("github") ? "id" : "sub"
        );
    }

    // ── Attribute extraction ──────────────────────────────────────────────────

    private OAuthUserInfo extractUserInfo(String provider, Map<String, Object> attrs) {
        return switch (provider) {
            case "google" -> extractGoogle(attrs);
            case "github" -> extractGitHub(attrs);
            default -> throw new OAuth2AuthenticationException(
                    new OAuth2Error("unsupported_provider"), "Unsupported Provider");
        };
    }

    private OAuthUserInfo extractGoogle(Map<String, Object> attrs) {
        return new OAuthUserInfo(
                String.valueOf(attrs.get("sub")),
                (String) attrs.get("email"),
                (String) attrs.get("name"),
                (String) attrs.get("picture")
        );
    }

    private OAuthUserInfo extractGitHub(Map<String, Object> attrs) {
        String oauthId = String.valueOf(attrs.get("id"));
        String login   = (String) attrs.getOrDefault("login", "");
        String name    = (String) attrs.getOrDefault("name", login);
        String email = (String) attrs.get("email");
        if (email == null || email.isBlank()) {
            email = login + "@users.noreply.github.com";
        }
        String avatar = (String) attrs.getOrDefault("avatar_url", null);
        return new OAuthUserInfo(oauthId, email, name, avatar);
    }

    private User findOrCreateUser(String provider, OAuthUserInfo info) {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String action = (String) request.getSession().getAttribute("oauth_action");
        
        // If no action is set, we default to 'login' for maximum security
        if (action == null || action.isBlank()) {
            action = "login";
        }

        Optional<User> byOauth = userRepository.findByOauthProviderAndOauthId(provider, info.oauthId);
        Optional<User> byEmail = userRepository.findByEmail(info.email);
        boolean exists = byOauth.isPresent() || byEmail.isPresent();

        log.info("OAuth Decision: action={} exists={} email={}", action, exists, info.email);

        // 🛑 Rule 1: Registration attempted, but user ALREADY exists
        if ("register".equalsIgnoreCase(action) && exists) {
            throw new OAuth2AuthenticationException(new OAuth2Error("account_already_exists"), "account_already_exists");
        }

        // 🛑 Rule 2: Login attempted, but account DOES NOT exist
        if ("login".equalsIgnoreCase(action) && !exists) {
            throw new OAuth2AuthenticationException(new OAuth2Error("account_not_registered"), "account_not_registered");
        }

        // Logic continues for Linking or New registration...
        if (byOauth.isPresent()) {
            User u = byOauth.get();
            // Update profile
            boolean changed = false;
            if (info.avatarUrl != null && !info.avatarUrl.equals(u.getAvatarUrl())) { u.setAvatarUrl(info.avatarUrl); changed = true; }
            if (info.name != null && !info.name.equals(u.getName())) { u.setName(info.name); changed = true; }
            if (changed) userRepository.save(u);
            return u;
        }

        if (byEmail.isPresent()) {
            User u = byEmail.get();
            u.setOauthProvider(provider);
            u.setOauthId(info.oauthId);
            if (info.avatarUrl != null) u.setAvatarUrl(info.avatarUrl);
            return userRepository.save(u);
        }

        // 3. New Registration
        log.info("Creating NEW account for Google user: {}", info.email);
        User newUser = User.builder()
                .email(info.email)
                .name(info.name != null && !info.name.isBlank() ? info.name : info.email.split("@")[0])
                .password(java.util.UUID.randomUUID().toString())
                .role(RoleType.USER)
                .oauthProvider(provider)
                .oauthId(info.oauthId)
                .avatarUrl(info.avatarUrl)
                .build();

        return userRepository.save(newUser);
    }

    // ── Internal DTO ──────────────────────────────────────────────────────────
    private record OAuthUserInfo(
            String oauthId,
            String email,
            String name,
            String avatarUrl
    ) {}
}
