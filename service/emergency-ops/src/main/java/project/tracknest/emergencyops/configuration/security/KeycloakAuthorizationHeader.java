package project.tracknest.emergencyops.configuration.security;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class KeycloakAuthorizationHeader {
    @JsonProperty("sub")
    private UUID userId;
    @JsonProperty("preferred_username")
    private String username;
    private String name;
    private String email;
    @JsonProperty("exp")
    private Long expiration;
    @JsonProperty("realm_access")
    private KeycloakAuthorizationHeaderRealmAccess realmAccess;
}
