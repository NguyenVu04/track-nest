package project.tracknest.usertracking.configuration.security;

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
import project.tracknest.usertracking.configuration.security.datatype.KeycloakAuthorizationHeader;
import project.tracknest.usertracking.core.datatype.KeycloakPrincipal;
import project.tracknest.usertracking.core.datatype.KeycloakUserDetails;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
public class KeycloakFilter extends OncePerRequestFilter {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_HEADER_LENGTH = 4096;
    private static final Pattern BEARER_TOKEN_PATTERN = Pattern.compile("^Bearer [A-Za-z0-9\\-_=]+\\.[A-Za-z0-9\\-_=]+\\.?[A-Za-z0-9\\-_.+/=]*$");
    private static final String AUTHORIZATION_KEY = "Authorization";

    private final SecurityUserRepository userRepository;

    public KeycloakFilter(SecurityUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {
        String authorizationHeader = request.getHeader(AUTHORIZATION_KEY);
        KeycloakAuthorizationHeader decoded = decodeKeycloakauthorizationHeader(authorizationHeader);

        if (decoded != null) {
            try {
                // build principal and user details (same mapping as KeycloakFilter)
                KeycloakPrincipal principal = new KeycloakPrincipal(decoded.getUserId());

                List<SimpleGrantedAuthority> roles = decoded
                        .getRealmAccess()
                        .getRoles()
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

                if (!userRepository.existsById(decoded.getUserId())) {
                    throw new IllegalStateException("User with ID " + decoded.getUserId() + " does not exist in the database");
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
            log.warn("Authorization header is missing or empty");
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
