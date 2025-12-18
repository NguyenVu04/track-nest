package project.tracknest.usertracking.configuration.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import project.tracknest.usertracking.core.datatype.KeycloakPrincipal;
import project.tracknest.usertracking.core.datatype.KeycloakUserDetails;

import java.util.UUID;

@Slf4j
public class SecurityUtils {
    public static UUID getCurrentUserId() throws AuthenticationException {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("No authenticated user found in security context when trying to get user ID");
            throw new AuthenticationException("User is not authenticated") {};
        }

        if (!(authentication.getPrincipal() instanceof KeycloakPrincipal principal)) {
            log.error("Authenticated principal is not of type KeycloakPrincipal");
            throw new AuthenticationException("Invalid user principal type") {};
        }

        try {
            return UUID.fromString(principal.getName());
        } catch (IllegalArgumentException e) {
            log.error("Failed to parse user ID from principal name: {}", principal.getName(), e);
            throw new AuthenticationException("Invalid user ID format") {};
        }
    }

    public static KeycloakUserDetails getCurrentUserDetails() throws AuthenticationException {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            log.error("No authenticated user found in security context when trying to get user details");
            throw new AuthenticationException("User is not authenticated") {};
        }

        if (!(authentication.getPrincipal() instanceof KeycloakUserDetails userDetails)) {
            log.error("Authenticated principal is not of type KeycloakUserDetails");
            throw new AuthenticationException("Invalid user principal type") {};
        }

        return userDetails;
    }
}
