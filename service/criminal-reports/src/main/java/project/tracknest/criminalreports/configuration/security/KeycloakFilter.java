package project.tracknest.criminalreports.configuration.security;

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
import org.springframework.web.filter.OncePerRequestFilter;
import project.tracknest.criminalreports.core.datatype.KeycloakPrincipal;
import project.tracknest.criminalreports.core.datatype.KeycloakUserDetails;
import project.tracknest.criminalreports.core.entity.Reporter;

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

    private final SecurityReporterRepository reporterRepository;

    public KeycloakFilter(SecurityReporterRepository reporterRepository) {
        this.reporterRepository = reporterRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {
        String authorizationHeader = request.getHeader(AUTHORIZATION_KEY);

        log.debug("[KeycloakFilter] {} {} — Authorization header present: {}",
                request.getMethod(), request.getRequestURI(), authorizationHeader != null);

        KeycloakAuthorizationHeader decoded = decodeKeycloakauthorizationHeader(authorizationHeader);

        if (decoded != null) {
            try {
                KeycloakPrincipal principal = new KeycloakPrincipal(decoded.getUserId());

                List<String> rawRoles = Optional.ofNullable(decoded.getRealmAccess())
                        .map(KeycloakAuthorizationHeaderRealmAccess::getRoles)
                        .orElse(Collections.emptyList());

                log.debug("[KeycloakFilter] realm_access present: {}, raw roles: {}",
                        decoded.getRealmAccess() != null, rawRoles);

                List<SimpleGrantedAuthority> roles = rawRoles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .toList();

                log.debug("[KeycloakFilter] Mapped authorities: {}", roles);

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

                boolean isReporter = rawRoles.contains("REPORTER");

                if (isReporter) {
                    Optional<Reporter> reporterOpt = reporterRepository
                            .findById(decoded.getUserId());
                    if (reporterOpt.isEmpty()) {
                        log.warn("No emergency service found for ID: {}", decoded.getUserId());

                        Reporter reporter = Reporter
                                .builder()
                                .id(decoded.getUserId())
                                .username(decoded.getUsername())
                                .build();
                        reporterRepository.save(reporter);
                    } else {
                        Reporter reporter = reporterOpt.get();
                        if (!reporter.getUsername().equals(decoded.getUsername())) {
                            log.info("Updating reporter info for ID: {}", decoded.getUserId());

                            reporter.setUsername(decoded.getUsername());
                            reporterRepository.save(reporter);
                        }
                    }
                }

                log.info("[KeycloakFilter] Security context set — user: {}, roles: {}",
                        principal.getName(), roles);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ex) {
                log.warn("[KeycloakFilter] Failed to set security context: {}", ex.getMessage(), ex);
            }
        } else {
            log.debug("[KeycloakFilter] No valid token decoded — proceeding as anonymous for {} {}",
                    request.getMethod(), request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }

    private KeycloakAuthorizationHeader decodeKeycloakauthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.trim().isEmpty()) {
            log.debug("[KeycloakFilter] Authorization header is absent or blank");
            return null;
        }

        log.debug("[KeycloakFilter] Token length: {}", authorizationHeader.length());

        if (authorizationHeader.length() > MAX_HEADER_LENGTH) {
            log.warn("[KeycloakFilter] Authorization header length {} exceeds limit {}",
                    authorizationHeader.length(), MAX_HEADER_LENGTH);
            return null;
        }

        if (!BEARER_TOKEN_PATTERN.matcher(authorizationHeader).matches()) {
            log.warn("[KeycloakFilter] Authorization header does not match Bearer token pattern. " +
                    "First 20 chars: {}", authorizationHeader.substring(0, Math.min(20, authorizationHeader.length())));
            return null;
        }

        try {
            String jwt = authorizationHeader.substring(7);
            String[] parts = jwt.split("\\.");

            if (parts.length != 3) {
                log.warn("[KeycloakFilter] JWT does not have exactly 3 parts, got {}", parts.length);
                return null;
            }

            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            log.debug("[KeycloakFilter] Decoded JWT payload: {}", payload);

            JsonNode node = MAPPER.readTree(payload);

            if (node.get("exp") == null) {
                log.warn("[KeycloakFilter] Token missing 'exp' claim");
                return null;
            }

            if (node.get("sub") == null) {
                log.warn("[KeycloakFilter] Token missing 'sub' claim");
                return null;
            }

            log.debug("[KeycloakFilter] realm_access node: {}",
                    node.has("realm_access") ? node.get("realm_access").toString() : "MISSING");

            KeycloakAuthorizationHeader header = MAPPER.treeToValue(node, KeycloakAuthorizationHeader.class);

            if (header.getExpiration() * 1000 < System.currentTimeMillis()) {
                log.warn("[KeycloakFilter] Token is expired (exp={})", header.getExpiration());
                return null;
            }

            return header;
        } catch (IllegalArgumentException | IOException ex) {
            log.warn("[KeycloakFilter] Failed to decode token: {}", ex.getMessage(), ex);
            return null;
        }
    }
}
