package project.tracknest.emergencyops.configuration.security.datatype;

import java.util.UUID;

public record KeycloakUserProfile (
    UUID id,
    String username,
    String email,
    String firstName,
    String lastName,
    String avatarUrl,
    String phoneNumber
) {}