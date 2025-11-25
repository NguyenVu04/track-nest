package project.tracknest.criminalreports.configuration.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class ThreadConfig {
    @Bean(destroyMethod = "shutdown")
    public ExecutorService newVirtualThreadPerTaskExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
