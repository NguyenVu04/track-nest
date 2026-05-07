package project.tracknest.emergencyops.configuration.security.datatype;

import java.util.UUID;

public record KeycloakEmergencyServiceProfile(
        UUID id,
        String username,
        String email,
        String firstName,
        String lastName,
        String phoneNumber
) {
}
