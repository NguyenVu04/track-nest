package project.tracknest.usertracking.configuration.security;

import lombok.Data;

import java.util.List;

@Data
public class KeycloakUserInfoHeaderRealmAccess {
    private List<String> roles;
}
