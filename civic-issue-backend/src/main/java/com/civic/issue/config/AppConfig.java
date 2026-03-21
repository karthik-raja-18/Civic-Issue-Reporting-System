package com.civic.issue.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * General application configuration.
 * Registers infrastructure beans used across the application.
 */
@Configuration
public class AppConfig {

    /**
     * Provides a shared RestTemplate bean for outbound HTTP calls
     * (e.g. analytics sync to the external Node.js service).
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
