package project.tracknest.usertracking.configuration;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class KafkaTopicConfig {

    @Value("${app.kafka.topics[0]}")
    private String locationTopicName;

    @Value("${app.kafka.topic.partitions}")
    private int partitions;

    @Value("${app.kafka.topic.replication-factor}")
    private short replicationFactor;

    @Bean
    public List<NewTopic> newTopics() {
        NewTopic locationTopic = new NewTopic(locationTopicName, partitions, replicationFactor);
        return List.of(locationTopic);
    }
}
