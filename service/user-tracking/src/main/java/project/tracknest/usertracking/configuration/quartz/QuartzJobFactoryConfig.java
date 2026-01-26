package project.tracknest.usertracking.configuration.quartz;

import org.quartz.spi.TriggerFiredBundle;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

@Configuration
public class QuartzJobFactoryConfig {
    @Bean
    public SpringBeanJobFactory springBeanJobFactory(
            AutowireCapableBeanFactory factory
    ) {
        return new SpringBeanJobFactory() {
            @Override
            protected Object createJobInstance(TriggerFiredBundle bundle) throws Exception {
                final Object job = super.createJobInstance(bundle);
                factory.autowireBean(job);
                return job;
            }
        };
    }
}
