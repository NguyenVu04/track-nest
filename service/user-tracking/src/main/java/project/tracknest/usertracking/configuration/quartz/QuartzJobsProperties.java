package project.tracknest.usertracking.configuration.quartz;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Map;

@Data
@ConfigurationProperties(prefix = "app.quartz")
public class QuartzJobsProperties {

    private Map<String, JobConfig> jobs;

    @Data
    public static class JobConfig {
        private String cron;
        private String description;
    }
}
