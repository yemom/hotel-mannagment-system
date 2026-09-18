package com.hotelmanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http) throws Exception {

                http

                                // Disable CSRF because this project uses a REST API
                                // and the frontend communicates using HTTP requests.
                                .csrf(csrf -> csrf.disable())

                                // Enable CORS using the bean defined below.
                                .cors(cors -> cors.configurationSource(
                                                corsConfigurationSource()))

                                // Disable Spring Security's default HTML login page.
                                .formLogin(form -> form.disable())

                                // Disable HTTP Basic authentication challenges.
                                .httpBasic(basic -> basic.disable())

                                // Allow all requests.
                                // Authentication/authorization is handled by the
                                // application's own API/frontend logic.
                                .authorizeHttpRequests(auth -> auth
                                                .anyRequest()
                                                .permitAll());

                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration configuration = new CorsConfiguration();

                /*
                 * setAllowedOriginPatterns() supports wildcards, so this
                 * covers localhost, 127.0.0.1, and common private LAN
                 * ranges (e.g. http://192.168.137.1:5173) without having
                 * to hardcode every possible machine IP.
                 */

                configuration.setAllowedOriginPatterns(
                                List.of(
                                                "http://localhost:*",
                                                "http://127.0.0.1:*",
                                                "http://192.168.*.*:*",
                                                "http://10.*.*.*:*"));

                configuration.setAllowedMethods(
                                List.of(
                                                "GET",
                                                "POST",
                                                "PUT",
                                                "DELETE",
                                                "PATCH",
                                                "OPTIONS"));

                configuration.setAllowedHeaders(
                                List.of("*"));

                configuration.setExposedHeaders(
                                List.of("*"));

                configuration.setAllowCredentials(false);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration(
                                "/**",
                                configuration);

                return source;
        }
}