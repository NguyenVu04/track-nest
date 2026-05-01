package project.tracknest.usertracking.configuration.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.grpc.*;
import io.grpc.Contexts;
import io.grpc.ForwardingServerCallListener.SimpleForwardingServerCallListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import project.tracknest.usertracking.configuration.security.datatype.KeycloakAuthorizationHeader;
import project.tracknest.usertracking.core.datatype.KeycloakPrincipal;
import project.tracknest.usertracking.core.datatype.KeycloakUserDetails;
import project.tracknest.usertracking.core.entity.User;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Slf4j
public class GrpcSecurityInterceptor implements ServerInterceptor {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_HEADER_LENGTH = 4096;
    private static final Pattern BEARER_TOKEN_PATTERN = Pattern.compile("^Bearer [A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$");
    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("Authorization", Metadata.ASCII_STRING_MARSHALLER);
    // gRPC Context propagates across thread handoffs; SecurityContextHolder (ThreadLocal) does not
    private static final Context.Key<SecurityContext> SECURITY_CTX_KEY = Context.key("security-context");

    private final SecurityUserRepository userRepository;

    public GrpcSecurityInterceptor(SecurityUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public <R, S> ServerCall.Listener<R> interceptCall(
            ServerCall<R, S> call,
            Metadata headers,
            ServerCallHandler<R, S> next) {

        String authorizationHeader = headers.get(AUTHORIZATION_KEY);
        KeycloakAuthorizationHeader decoded = decodeKeycloakauthorizationHeader(authorizationHeader);

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();

        if (decoded != null) {
            try {
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
                securityContext.setAuthentication(authentication);

                Optional<User> userOpt = userRepository.findById(decoded.getUserId());

                OffsetDateTime now = OffsetDateTime.now();
                if (userOpt.isEmpty()) {
                    log.warn("User not found in database for ID: {}", decoded.getUserId());
                    userRepository.save(User
                            .builder()
                            .id(decoded.getUserId())
                            .username(decoded.getUsername())
                            .connected(true)
                            .lastActive(now)
                            .avatarUrl(decoded.getAvatar())
                            .build());
                } else {
                    User user = userOpt.get();
                    user.setConnected(true);
                    user.setLastActive(now);
                    user.setUsername(decoded.getUsername());
                    user.setAvatarUrl(decoded.getAvatar());
                    userRepository.save(user);
                }

                log.info("Setting gRPC security context with user: {}", principal.getName());
            } catch (Exception ex) {
                log.warn("Failed to set gRPC security context from authorization header: {}", ex.getMessage());
            }
        }

        // Attach to gRPC Context so it survives thread handoffs in the executor pool.
        // SecurityContextHolder is ThreadLocal and would be lost when the gRPC framework
        // dispatches onHalfClose on a different thread than interceptCall.
        Context grpcContext = Context.current().withValue(SECURITY_CTX_KEY, securityContext);
        ServerCall.Listener<R> delegate = Contexts.interceptCall(grpcContext, call, headers, next);

        return new SimpleForwardingServerCallListener<>(delegate) {
            @Override
            public void onHalfClose() {
                SecurityContextHolder.setContext(securityContext);
                try {
                    super.onHalfClose();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            }

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

            KeycloakAuthorizationHeader header = MAPPER.readValue(payload, KeycloakAuthorizationHeader.class);
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