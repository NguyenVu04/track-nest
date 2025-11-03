package project.tracknest.usertracking.configuration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;
import project.tracknest.usertracking.core.KeycloakPrincipal;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.regex.Pattern;

public class KeycloakFilter extends OncePerRequestFilter {
    private final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_HEADER_LENGTH = 8192;
    private static final Pattern BASE64_URL_SAFE_PATTERN = Pattern.compile("^[A-Za-z0-9\\-_]+=*$");

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

        KeycloakPrincipal principal = getKeycloakPrincipal(userInfoHeader);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private KeycloakPrincipal getKeycloakPrincipal(String userInfoHeader) throws IOException {
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
            return MAPPER.treeToValue(node, KeycloakPrincipal.class);
        } catch (IllegalArgumentException | IOException ex) {
            return null;
        }
    }
}
