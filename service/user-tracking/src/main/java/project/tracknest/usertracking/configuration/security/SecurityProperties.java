package project.tracknest.usertracking.configuration.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
    private List<String> allowedOrigins;
    private List<String> allowedMethods;
}
