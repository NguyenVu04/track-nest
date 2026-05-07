package project.tracknest.emergencyops.configuration.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakEmergencyServiceProfile;
import project.tracknest.emergencyops.configuration.security.datatype.KeycloakUserProfile;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class KeycloakService {
    private static final String PHONE_NUMBER_ATTR = "phoneNumber";
    private static final String AVATAR_ATTR = "avatar";

    private final Keycloak keycloak;
    private final Keycloak restrictedKeycloak;

    @Value("${app.keycloak.public-realm}")
    private String keycloakPublicRealm;

    @Value("${app.keycloak.restricted-realm}")
    private String keycloakRestrictedRealm;

    @Cacheable(value = "user-profile", key = "#id", unless = "#result == null")
    public KeycloakUserProfile getUserProfile(UUID id) {
        UserRepresentation user = keycloak
                .realm(keycloakPublicRealm)
                .users()
                .get(id.toString())
                .toRepresentation();

        String phoneNumber = getAttribute(user, PHONE_NUMBER_ATTR);
        String avatarUrl = getAttribute(user, AVATAR_ATTR);

        return new KeycloakUserProfile(
                id,
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                avatarUrl,
                phoneNumber
        );
    }

    @Cacheable(value = "emergency-service-profile", key = "#id", unless = "#result == null")
    public KeycloakEmergencyServiceProfile getEmergencyServiceProfile(UUID id) {
        UserRepresentation user = restrictedKeycloak
                .realm(keycloakRestrictedRealm)
                .users()
                .get(id.toString())
                .toRepresentation();

        String phoneNumber = getAttribute(user, PHONE_NUMBER_ATTR);

        return new KeycloakEmergencyServiceProfile(
                id,
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                phoneNumber
        );
    }

    private String getAttribute(UserRepresentation user, String attribute) {
        if (user.getAttributes() == null) return null;
        var values = user.getAttributes().get(attribute);
        return values != null ? values.getFirst() : null;
    }
}
