package com.civic.issue.config;

import com.civic.issue.entity.User;
import com.civic.issue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Fallback for password if null (common for OAuth-created accounts)
        String password = user.getPassword() != null ? user.getPassword() : "[PASSWORD_DISABLED_OAUTH]";
        
        // Fallback for role if null (prevents NPE during security context buildup)
        String roleName = (user.getRole() != null) ? user.getRole().name() : "USER";

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                password,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
    }
}
