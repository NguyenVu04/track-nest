package project.tracknest.emergencyops.configuration.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.keycloak")
public class KeycloakProperties {
    private String serverUrl;
    private String publicRealm;
    private String clientId;
    private String clientSecret;
}
