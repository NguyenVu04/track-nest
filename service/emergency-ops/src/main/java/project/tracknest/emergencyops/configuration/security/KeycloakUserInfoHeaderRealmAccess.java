package project.tracknest.emergencyops.configuration.security;

import lombok.Data;

import java.util.List;

@Data
public class KeycloakUserInfoHeaderRealmAccess {
    private List<String> roles;
}
