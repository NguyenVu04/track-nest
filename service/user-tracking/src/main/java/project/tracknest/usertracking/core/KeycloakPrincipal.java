package project.tracknest.usertracking.core;

import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.security.Principal;
import java.util.UUID;

public class KeycloakPrincipal implements Principal {
    private UUID userId;
    @Getter
    private String username;
    @Getter
    private String email;

    @Override
    public String getName() {
        return userId.toString();
    }
}
