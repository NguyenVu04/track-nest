package project.tracknest.usertracking.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        String KEYCLOAK_SECURITY_SCHEME_NAME = "keycloak-user-info-header-scheme";
        return new OpenAPI()
                .info(new Info().title("User Tracking Service API").version("1.0.0"))
                .components(new Components()
                        .addSecuritySchemes(KEYCLOAK_SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.HEADER)
                                        .name("X-Userinfo")
                                        .description("Keycloak user info header")))
                .addSecurityItem(new SecurityRequirement().addList(KEYCLOAK_SECURITY_SCHEME_NAME));
    }
}
