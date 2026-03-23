package project.tracknest.usertracking.configuration.security;


import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.grpc.server.GlobalServerInterceptor;
import project.tracknest.usertracking.controller.GrpcGlobalExceptionHandler;

@Configuration
@RequiredArgsConstructor
public class GrpcSecurityConfig {
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    @GlobalServerInterceptor
    public GrpcSecurityInterceptor grpcSecurityInterceptor() {
        return new GrpcSecurityInterceptor();
    }

    @Bean
    @GlobalServerInterceptor
    public GrpcGlobalExceptionHandler grpcGlobalExceptionHandler() {
        return new GrpcGlobalExceptionHandler();
    }
}
