package project.tracknest.usertracking.configuration.security.datatype;

import lombok.Data;

import java.util.List;

@Data
public class KeycloakUserInfoHeaderRealmAccess {
    private List<String> roles;
}
