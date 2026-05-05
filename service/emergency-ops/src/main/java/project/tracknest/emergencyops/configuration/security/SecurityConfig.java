package project.tracknest.emergencyops.configuration.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(SecurityProperties.class)
@RequiredArgsConstructor
public class SecurityConfig {
    private final SecurityProperties securityProperties;
    private final SecurityEmergencyServiceRepository serviceRepository;

    @Bean
    protected SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .addFilterAfter(new KeycloakFilter(serviceRepository), UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**")
                        .permitAll()
                        .requestMatchers("/emergency-admin/**")
                        .authenticated()
                        .requestMatchers("/emergency-request-manager/**")
                        .hasRole("EMERGENCY-SERVICE")
                        .requestMatchers("/emergency-request-receiver/**")
                        .hasRole("USER")
                        .requestMatchers("/emergency-responder/**")
                        .hasRole("EMERGENCY-SERVICE")
                        .requestMatchers("/safe-zone-manager/**")
                        .hasRole("EMERGENCY-SERVICE")
                        .requestMatchers("/safe-zone-locator/**")
                        .hasRole("USER")
                        .requestMatchers("/ws/**")
                        .hasRole("EMERGENCY-SERVICE")
                        .requestMatchers("/actuator/**")
                        .permitAll()
                        .anyRequest()
                        .denyAll()
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable);
        return http.build();
    }

    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(securityProperties.getAllowedOrigins());
        config.setAllowedMethods(securityProperties.getAllowedMethods());
        config.setAllowCredentials(true);
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
