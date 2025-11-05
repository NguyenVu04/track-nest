package project.tracknest.usertracking.configuration.datatype;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.kafka")
public class KafkaProperties {
    private List<String> topics;

    private int partitions;

    private short replicationFactor;
}
