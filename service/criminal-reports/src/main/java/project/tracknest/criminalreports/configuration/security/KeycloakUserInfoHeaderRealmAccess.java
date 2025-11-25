package project.tracknest.criminalreports.configuration.security;

import lombok.Data;

import java.util.List;

@Data
public class KeycloakUserInfoHeaderRealmAccess {
    private List<String> roles;
}
