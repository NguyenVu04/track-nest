package project.tracknest.emergencyops.configuration.security.datatype;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KeycloakAuthorizationHeaderRealmAccess {
    private List<String> roles;
}
