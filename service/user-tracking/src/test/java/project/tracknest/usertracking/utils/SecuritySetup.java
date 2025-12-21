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
    public static void setUpSecurityContext() {
        KeycloakAuthorizationHeader decoded = KeycloakAuthorizationHeader.builder()
                .userId(UUID.fromString("f8f735b4-549c-4d8c-9e10-15f8c198b71b"))
                .username("admin")
                .email("admin@gmail.com")
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
