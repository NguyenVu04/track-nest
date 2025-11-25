package project.tracknest.usertracking.configuration.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import project.tracknest.usertracking.core.datatype.KeycloakPrincipal;
import project.tracknest.usertracking.core.datatype.KeycloakUserDetails;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;

public class KeycloakFilter extends OncePerRequestFilter {
    private final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_HEADER_LENGTH = 1024;
    private static final Pattern BASE64_URL_SAFE_PATTERN = Pattern
            .compile("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {
        String userInfoHeader = request.getHeader("X-Userinfo");

        if (userInfoHeader == null || userInfoHeader.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        KeycloakUserInfoHeader decodedHeader = decodeKeycloakUserInfoHeader(userInfoHeader);

        if (decodedHeader == null) {
            filterChain.doFilter(request, response);
            return;
        }

        KeycloakPrincipal principal = new KeycloakPrincipal(decodedHeader.getUserId());

        List<SimpleGrantedAuthority> roles = decodedHeader
                .getRealmAccess()
                .getRoles()
                .stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();

        KeycloakUserDetails userDetails = KeycloakUserDetails
                .builder()
                .userId(decodedHeader.getUserId())
                .username(decodedHeader.getUsername())
                .email(decodedHeader.getEmail())
                .roles(roles)
                .build();

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, roles);
        authentication.setDetails(userDetails);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    private KeycloakUserInfoHeader decodeKeycloakUserInfoHeader(String userInfoHeader) {
        if (userInfoHeader == null || userInfoHeader.trim().isEmpty())
            return null;

        if (userInfoHeader.length() > MAX_HEADER_LENGTH)
            return null;

        if (!BASE64_URL_SAFE_PATTERN.matcher(userInfoHeader).matches())
            return null;

        try {
            Base64.Decoder decoder = userInfoHeader.contains("-") || userInfoHeader.contains("_")
                    ? Base64.getUrlDecoder()
                    : Base64.getDecoder();

            String json = new String(decoder.decode(userInfoHeader), StandardCharsets.UTF_8);

            JsonNode node = MAPPER.readTree(json);
            return MAPPER.treeToValue(node, KeycloakUserInfoHeader.class);
        } catch (IllegalArgumentException | IOException ex) {
            return null;
        }
    }
}
