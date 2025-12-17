package project.tracknest.usertracking.configuration.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.grpc.*;
import io.grpc.ForwardingServerCallListener.SimpleForwardingServerCallListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import project.tracknest.usertracking.configuration.security.datatype.KeycloakUserInfoHeader;
import project.tracknest.usertracking.core.datatype.KeycloakPrincipal;
import project.tracknest.usertracking.core.datatype.KeycloakUserDetails;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
public class GrpcSecurityInterceptor implements ServerInterceptor {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_HEADER_LENGTH = 4096;
    private static final Pattern BASE64_URL_SAFE_PATTERN = Pattern
            .compile("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");
    private static final Metadata.Key<String> USERINFO_KEY =
            Metadata.Key.of("X-Userinfo", Metadata.ASCII_STRING_MARSHALLER);

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String userInfoHeader = headers.get(USERINFO_KEY);
        log.info("Received x-userinfo header: {}", userInfoHeader);
        KeycloakUserInfoHeader decoded = decodeKeycloakUserInfoHeader(userInfoHeader);
        log.info("Decoded x-userinfo header: {}", decoded);

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
                        new UsernamePasswordAuthenticationToken(principal, null, roles);
                authentication.setDetails(userDetails);
                log.info("Setting gRPC security context with user: {}", principal.getName());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ex) {
                log.warn("Failed to set gRPC security context from x-userinfo: {}", ex.getMessage());
            }
        }

        ServerCall.Listener<ReqT> delegate = next.startCall(call, headers);

        return new SimpleForwardingServerCallListener<>(delegate) {
            @Override
            public void onComplete() {
                try {
                    super.onComplete();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            }

            @Override
            public void onCancel() {
                try {
                    super.onCancel();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            }
        };
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