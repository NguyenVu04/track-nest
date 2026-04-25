package project.tracknest.usertracking.configuration.kafka;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Map;

@Data
@ConfigurationProperties(prefix = "app.kafka")
public class KafkaProperties {
    private Map<String, String> topics;

    private int partitions;

    private short replicationFactor;
}
