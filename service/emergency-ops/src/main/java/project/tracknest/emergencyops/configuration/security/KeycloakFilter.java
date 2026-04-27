package project.tracknest.emergencyops.configuration.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.filter.OncePerRequestFilter;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakAuthorizationHeader;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakAuthorizationHeaderRealmAccess;
import project.tracknest.emergencyops.core.datatype.KeycloakPrincipal;
import project.tracknest.emergencyops.core.datatype.KeycloakUserDetails;
import project.tracknest.emergencyops.core.entity.EmergencyService;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Slf4j
public class KeycloakFilter extends OncePerRequestFilter {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_HEADER_LENGTH = 4096;
    private static final Pattern BEARER_TOKEN_PATTERN = Pattern.compile("^Bearer [A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$");
    private static final String AUTHORIZATION_KEY = "Authorization";

    private final SecurityEmergencyServiceRepository serviceRepository;

    public KeycloakFilter(SecurityEmergencyServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @Override
    @Transactional
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {
        String authorizationHeader = request.getHeader(AUTHORIZATION_KEY);
        // Fallback for WebSocket connections — browsers cannot set Authorization headers on WS upgrade requests
        if (authorizationHeader == null) {
            String tokenParam = request.getParameter("access_token");
            if (tokenParam != null && !tokenParam.isBlank()) {
                authorizationHeader = "Bearer " + tokenParam;
            }
        }
        KeycloakAuthorizationHeader decoded = decodeKeycloakauthorizationHeader(authorizationHeader);

        if (decoded != null) {
            try {
                // build principal and user details (same mapping as KeycloakFilter)
                KeycloakPrincipal principal = new KeycloakPrincipal(decoded.getUserId());

                List<SimpleGrantedAuthority> roles = Optional.ofNullable(decoded.getRealmAccess())
                        .map(KeycloakAuthorizationHeaderRealmAccess::getRoles)
                        .orElse(Collections.emptyList())
                        .stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .toList();

                KeycloakUserDetails userDetails = KeycloakUserDetails
                        .builder()
                        .userId(decoded.getUserId())
                        .username(decoded.getUsername())
                        .email(decoded.getEmail())
                        .roles(roles)
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, authorizationHeader, roles);
                authentication.setDetails(userDetails);

                boolean isEmergencyService = Optional.ofNullable(decoded.getRealmAccess())
                        .map(KeycloakAuthorizationHeaderRealmAccess::getRoles)
                        .orElse(Collections.emptyList())
                        .contains("EMERGENCY-SERVICE");
                if (isEmergencyService) {

                    Optional<EmergencyService> serviceOpt = serviceRepository
                            .findById(decoded.getUserId());
                    if (serviceOpt.isEmpty()) {
                        log.warn("No emergency service found for ID: {}", decoded.getUserId());

                        EmergencyService service = EmergencyService
                                .builder()
                                .id(decoded.getUserId())
                                .username(decoded.getUsername())
                                .phoneNumber(decoded.getPhoneNumber())
                                .build();
                        serviceRepository.save(service);
                    } else {
                        EmergencyService service = serviceOpt.get();
                        if (!service.getUsername().equals(decoded.getUsername()) ||
                                !service.getPhoneNumber().equals(decoded.getPhoneNumber())) {
                            log.info("Updating emergency service info for ID: {}", decoded.getUserId());

                            service.setUsername(decoded.getUsername());
                            service.setPhoneNumber(decoded.getPhoneNumber());
                            serviceRepository.save(service);
                        }
                    }
                }

                log.info("Setting security context with user: {}", principal.getName());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ex) {
                log.warn("Failed to set security context from authorization header: {}", ex.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private KeycloakAuthorizationHeader decodeKeycloakauthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.trim().isEmpty()) {
            return null;
        }

        if (authorizationHeader.length() > MAX_HEADER_LENGTH) {
            log.warn("Authorization header exceeds maximum length");
            return null;
        }

        if (!BEARER_TOKEN_PATTERN.matcher(authorizationHeader).matches()) {
            log.warn("Authorization header does not match Bearer token pattern");
            return null;
        }

        try {
            String jwt = authorizationHeader.substring(7); // Remove "Bearer " prefix

            String[] parts = jwt.split("\\."); // JWT has three parts: header, payload, signature
            if (parts.length < 2) {
                log.warn("Authorization header token has invalid structure");
                return null;
            }

            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));

            JsonNode node = MAPPER.readTree(payload);

            if (node.get("exp") == null) {
                log.warn("Authorization header token is missing expiration");
                return null;
            }

            if (node.get("sub") == null) {
                log.warn("Authorization header token is missing subject");
                return null;
            }

            KeycloakAuthorizationHeader header = MAPPER.treeToValue(node, KeycloakAuthorizationHeader.class);
            if (header.getExpiration() * 1000 < System.currentTimeMillis()) {
                log.warn("Authorization header token is expired");
                return null;
            }
            return header;
        } catch (IllegalArgumentException | IOException ex) {
            log.warn("Failed to decode Authorization header: {}", ex.getMessage());
            return null;
        }
    }
}
