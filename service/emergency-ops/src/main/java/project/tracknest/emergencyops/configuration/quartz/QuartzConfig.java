package project.tracknest.emergencyops.configuration.quartz;

import org.quartz.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import project.tracknest.emergencyops.configuration.websocket.UpdateWebSocketSessionsJob;

@Configuration
@EnableConfigurationProperties(QuartzJobsProperties.class)
public class QuartzConfig {

    private final QuartzJobsProperties props;

    public QuartzConfig(QuartzJobsProperties props) {
        this.props = props;
    }

    // ---------- Factory Methods ----------

    private JobDetail buildJobDetail(Class<? extends Job> jobClass, String name, String description) {
        return JobBuilder.newJob(jobClass)
                .withIdentity(name)
                .withDescription(description)
                .storeDurably()
                .build();
    }

    private Trigger buildCronTrigger(JobDetail jobDetail, String name, String cron) {
        return TriggerBuilder.newTrigger()
                .forJob(jobDetail)
                .withIdentity(name)
                .withSchedule(CronScheduleBuilder.cronSchedule(cron))
                .build();
    }

    // ---------- Jobs ----------

    @Bean
    public JobDetail updateWebSocketSessionsJobDetail() {
        var config = props.getJobs().get("updateWebSocketSessions");

        return buildJobDetail(
                UpdateWebSocketSessionsJob.class,
                "updateWebSocketSessionsJob",
                config.getDescription()
        );
    }

    @Bean
    public Trigger updateWebSocketSessionsTrigger(
            @Qualifier("updateWebSocketSessionsJobDetail") JobDetail jobDetail
    ) {
        var config = props.getJobs().get("updateWebSocketSessions");

        return buildCronTrigger(
                jobDetail,
                "updateWebSocketSessionsTrigger",
                config.getCron()
        );
    }
}
