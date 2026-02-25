package com.civic.issue.config;

import com.civic.issue.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter  jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // ── Public endpoints ──────────────────────────────────────
                        .requestMatchers("/api/auth/**").permitAll()

                        // ── Issue read — all authenticated users ──────────────────
                        .requestMatchers(HttpMethod.GET,
                                "/api/issues", "/api/issues/**").authenticated()

                        // ── Image upload — all authenticated users ────────────────
                        .requestMatchers(HttpMethod.POST,
                                "/api/issues/upload-image").authenticated()  // ✅ NEW

                        // ── Issue create + comment — all authenticated users ───────
                        .requestMatchers(HttpMethod.POST,
                                "/api/issues", "/api/issues/*/comments").authenticated()

                        // ── Status update — ADMIN or REGIONAL_ADMIN ───────────────
                        .requestMatchers(HttpMethod.PUT,
                                "/api/issues/*/status")
                        .hasAnyRole("ADMIN", "REGIONAL_ADMIN")          // ✅ UPDATED

                        // ── Delete — ADMIN only ───────────────────────────────────
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/issues/**").hasRole("ADMIN")

                        // ── Admin management — ADMIN only ─────────────────────────
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")      // ✅ NEW

                        // ── Regional admin endpoints ───────────────────────────────
                        .requestMatchers("/api/regional/**")
                        .hasAnyRole("ADMIN", "REGIONAL_ADMIN")          // ✅ NEW

                        // ── Notifications — authenticated ──────────────────────────
                        .requestMatchers("/api/notifications").authenticated()

                        // ── Everything else requires auth ──────────────────────────
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("*"));
        config.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
