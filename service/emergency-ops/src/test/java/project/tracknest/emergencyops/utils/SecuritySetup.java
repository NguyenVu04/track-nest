package project.tracknest.emergencyops.utils;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakAuthorizationHeader;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakAuthorizationHeaderRealmAccess;
import project.tracknest.emergencyops.core.datatype.KeycloakPrincipal;
import project.tracknest.emergencyops.core.datatype.KeycloakUserDetails;

import java.util.List;
import java.util.UUID;

public class SecuritySetup {
    public static final UUID ADMIN_USER_ID = UUID.fromString("0e745cb3-5f38-419b-b446-d204c2e15ba9");
    public static final String ADMIN_USERNAME = "admin";
    public static final String ADMIN_EMAIL = "admin@gmail.com";
    public static final double ADMIN_DEFAULT_LATITUDE = 0.0;
    public static final double ADMIN_DEFAULT_LONGITUDE = 0.0;

    public static void setUpSecurityContext() {
        setUpSecurityContext(ADMIN_USER_ID, ADMIN_USERNAME, ADMIN_EMAIL);
    }

    public static void setUpSecurityContext(UUID userId, String username, String email) {
        KeycloakAuthorizationHeader decoded = KeycloakAuthorizationHeader.builder()
                .userId(userId)
                .username(username)
                .email(email)
                .realmAccess(KeycloakAuthorizationHeaderRealmAccess.builder().roles(List.of("ROLE_USER", "ROLE_ADMIN")).build())
                .build();

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

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
