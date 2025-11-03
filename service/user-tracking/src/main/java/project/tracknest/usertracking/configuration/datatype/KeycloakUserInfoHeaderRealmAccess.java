package project.tracknest.usertracking.configuration.datatype;

import lombok.Data;

import java.util.List;

@Data
public class KeycloakUserInfoHeaderRealmAccess {
    private List<String> roles;
}
