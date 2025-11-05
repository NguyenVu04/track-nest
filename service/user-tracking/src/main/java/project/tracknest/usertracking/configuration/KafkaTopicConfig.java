package project.tracknest.usertracking.configuration;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import project.tracknest.usertracking.configuration.datatype.KafkaProperties;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Configuration
@EnableConfigurationProperties(KafkaProperties.class)
public class KafkaTopicConfig {

    private final KafkaProperties props;

    public KafkaTopicConfig(KafkaProperties props) {
        this.props = props;
    }

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
