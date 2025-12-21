package project.tracknest.usertracking.configuration.security.datatype;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class KeycloakAuthorizationHeaderRealmAccess {
    private List<String> roles;
}
