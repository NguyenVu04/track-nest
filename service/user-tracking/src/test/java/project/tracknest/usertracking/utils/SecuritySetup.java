package project.tracknest.usertracking.utils;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import project.tracknest.usertracking.configuration.security.datatype.KeycloakAuthorizationHeader;
import project.tracknest.usertracking.configuration.security.datatype.KeycloakAuthorizationHeaderRealmAccess;
import project.tracknest.usertracking.core.datatype.KeycloakPrincipal;
import project.tracknest.usertracking.core.datatype.KeycloakUserDetails;

import java.util.List;
import java.util.UUID;

public class SecuritySetup {
    public static final UUID ADMIN_USER_ID = UUID.fromString("f8f735b4-549c-4d8c-9e10-15f8c198b71b");
    public static final String ADMIN_USERNAME = "admin";
    public static final String ADMIN_EMAIL = "admin@gmail.com";
    public static final String ADMIN_DEVICE_ID = "99999999-9999-4999-8999-999999999999";
    public static final String ADMIN_TRACKING_NOTIFICATION_ID = "bbbbbbbb-0009-4000-8000-bbbbbbbbbbbb";
    public static final String ADMIN_RISK_NOTIFICATION_ID = "cccccccc-1008-4000-8000-cccccccccccc";

    // Test user IDs from test data
    public static final UUID USER1_ID = UUID.fromString("dd382dcf-3652-499c-acdb-5d9ce99a67b8");
    public static final UUID USER2_ID = UUID.fromString("8c52c01e-42a7-45cc-9254-db8a7601c764");
    public static final UUID USER3_ID = UUID.fromString("4405a37d-bc86-403e-b605-bedd7db88d37");
    public static final UUID USER4_ID = UUID.fromString("2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5");

    // Family circle IDs from test data
    public static final String FAMILY_CIRCLE_1_ID = "cccccccc-1000-4000-8000-cccccccccccc";
    public static final String FAMILY_CIRCLE_2_ID = "cccccccc-1001-4000-8000-cccccccccccc";
    public static final String FAMILY_CIRCLE_3_ID = "cccccccc-1004-4000-8000-cccccccccccc";
    public static final String FAMILY_CIRCLE_4_ID = "cccccccc-1003-4000-8000-cccccccccccc";
    public static final String ADMIN_CIRCLE_ID = "cccccccc-1002-4000-8000-cccccccccccc";

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
