package project.tracknest.usertracking.configuration.kafka;

import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableConfigurationProperties(KafkaProperties.class)
@RequiredArgsConstructor
public class KafkaTopicConfig {

    private final KafkaProperties props;

    @Bean
    public List<NewTopic> newTopics() {
        List<String> topics = props.getTopics();
        if (topics == null || topics.isEmpty()) {
            return Collections.emptyList();
        }
        return topics.stream()
                .map(name -> new NewTopic(
                        name, props.getPartitions(), props.getReplicationFactor()))
                .collect(Collectors.toList());
    }
}
