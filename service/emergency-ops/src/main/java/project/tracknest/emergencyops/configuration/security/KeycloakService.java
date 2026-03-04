package project.tracknest.emergencyops.configuration.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class KeycloakService {
    private final Keycloak keycloak;

    @Value("${app.keycloak.public-realm}")
    private String keycloakPublicRealm;

    @Cacheable(value = "user-profile", key = "#id", unless = "#result == null")
    public KeycloakUserProfile getUserProfile(UUID id) {
        UserRepresentation user = keycloak
                .realm(keycloakPublicRealm)
                .users()
                .get(id.toString())
                .toRepresentation();

        String targetUsername = user.getUsername();

        String targetPhoneNumber = user.getAttributes() != null
                ? user.getAttributes().get("phoneNumber") != null
                ? user.getAttributes().get("phoneNumber").getFirst()
                : null
                : null;

        String targetEmail = user.getEmail();

        String targetAvatarUrl = user.getAttributes() != null
                ? user.getAttributes().get("avatar") != null
                ? user.getAttributes().get("avatar").getFirst()
                : null
                : null;

        String firstName = user.getFirstName();
        String lastName = user.getLastName();

        return new KeycloakUserProfile(
                id,
                targetUsername,
                targetEmail,
                firstName,
                lastName,
                targetAvatarUrl,
                targetPhoneNumber
        );
    }
}
