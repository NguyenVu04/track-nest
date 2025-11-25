package project.tracknest.emergencyops.core.datatype;

import java.security.Principal;
import java.util.UUID;

public record KeycloakPrincipal(UUID userId) implements Principal {

    @Override
    public String getName() {
        return userId.toString();
    }

    @Override
    public String toString() {
        return userId.toString();
    }
}
