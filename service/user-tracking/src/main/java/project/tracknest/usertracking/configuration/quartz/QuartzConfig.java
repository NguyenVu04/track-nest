package project.tracknest.usertracking.configuration.quartz;

import org.quartz.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import project.tracknest.usertracking.domain.anomalydetector.impl.AnomalyRunCleanupJob;
import project.tracknest.usertracking.domain.anomalydetector.impl.CellVisitMaintenanceJob;
import project.tracknest.usertracking.domain.tracker.locationcommand.impl.DisconnectInactiveUsersJob;
import project.tracknest.usertracking.domain.tracker.locationcommand.impl.LocationCleanupJob;
import project.tracknest.usertracking.domain.tracker.locationquery.impl.UpdateGrpcSessionsJob;

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
    public JobDetail disconnectInactiveUsersJobDetail() {
        var config = props.getJobs().get("disconnectInactiveUsers");

        return buildJobDetail(
                DisconnectInactiveUsersJob.class,
                "disconnectInactiveUsersJob",
                config.getDescription()
        );
    }

    @Bean
    public Trigger disconnectInactiveUsersTrigger(
            @Qualifier("disconnectInactiveUsersJobDetail") JobDetail jobDetail
    ) {
        var config = props.getJobs().get("disconnectInactiveUsers");

        return buildCronTrigger(
                jobDetail,
                "disconnectInactiveUsersTrigger",
                config.getCron()
        );
    }

    @Bean
    public JobDetail updateGrpcSessionsJobDetail() {
        var config = props.getJobs().get("updateGrpcSessions");

        return buildJobDetail(
                UpdateGrpcSessionsJob.class,
                "updateGrpcSessionsJob",
                config.getDescription()
        );
    }

    @Bean
    public Trigger updateGrpcSessionsTrigger(
            @Qualifier("updateGrpcSessionsJobDetail") JobDetail jobDetail
    ) {
        var config = props.getJobs().get("updateGrpcSessions");

        return buildCronTrigger(
                jobDetail,
                "updateGrpcSessionsTrigger",
                config.getCron()
        );
    }

    @Bean
    public JobDetail cellVisitMaintenanceJobDetail() {
        var config = props.getJobs().get("cellVisitMaintenance");

        return buildJobDetail(
                CellVisitMaintenanceJob.class,
                "cellVisitMaintenanceJob",
                config.getDescription()
        );
    }

    @Bean
    public Trigger cellVisitMaintenanceTrigger(
            @Qualifier("cellVisitMaintenanceJobDetail") JobDetail jobDetail
    ) {
        var config = props.getJobs().get("cellVisitMaintenance");

        return buildCronTrigger(
                jobDetail,
                "cellVisitMaintenanceTrigger",
                config.getCron()
        );
    }

    @Bean
    public JobDetail anomalyRunCleanupJobDetail() {
        var config = props.getJobs().get("anomalyRunCleanup");

        return buildJobDetail(
                AnomalyRunCleanupJob.class,
                "anomalyRunCleanupJob",
                config.getDescription()
        );
    }

    @Bean
    public Trigger anomalyRunCleanupTrigger(
            @Qualifier("anomalyRunCleanupJobDetail") JobDetail jobDetail
    ) {
        var config = props.getJobs().get("anomalyRunCleanup");

        return buildCronTrigger(
                jobDetail,
                "anomalyRunCleanupTrigger",
                config.getCron()
        );
    }

    @Bean
    public JobDetail locationCleanupJobDetail() {
        var config = props.getJobs().get("locationCleanup");

        return buildJobDetail(
                LocationCleanupJob.class,
                "locationCleanupJob",
                config.getDescription()
        );
    }

    @Bean
    public Trigger locationCleanupTrigger(
            @Qualifier("locationCleanupJobDetail") JobDetail jobDetail
    ) {
        var config = props.getJobs().get("locationCleanup");

        return buildCronTrigger(
                jobDetail,
                "locationCleanupTrigger",
                config.getCron()
        );
    }
}
