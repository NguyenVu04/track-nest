package project.tracknest.usertracking.configuration.quartz;

import org.quartz.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import project.tracknest.usertracking.domain.tracker.locationcommand.impl.DisconnectInactiveUsersJob;

@Configuration
public class QuartzConfig {
    @Bean
    public JobDetail disconnectInactiveUsersJobDetail() {
        return JobBuilder.newJob(DisconnectInactiveUsersJob.class)
                .withIdentity("disconnectInactiveUsersJob")
                .withDescription("Job to disconnect inactive users")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger disconnectInactiveUsersJobTrigger(
            @Qualifier("disconnectInactiveUsersJobDetail") JobDetail disconnectInactiveUsersJobDetail
    ) {
        return TriggerBuilder.newTrigger()
                .forJob(disconnectInactiveUsersJobDetail)
                .withIdentity("disconnectInactiveUsersTrigger")
                .withDescription("Trigger for disconnecting inactive users")
                .startNow()
                .withSchedule(
                        CronScheduleBuilder.cronSchedule("0 */4 * * * ?") // Every 4 minutes
                )
                .build();
    }
}
