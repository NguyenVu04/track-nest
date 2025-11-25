package project.tracknest.usertracking.configuration.security;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.UUID;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KeycloakUserInfoHeader {
    @JsonProperty("sub")
    private UUID userId;
    private String username;
    private String email;
    @JsonProperty("realm_access")
    private KeycloakUserInfoHeaderRealmAccess realmAccess;
}
