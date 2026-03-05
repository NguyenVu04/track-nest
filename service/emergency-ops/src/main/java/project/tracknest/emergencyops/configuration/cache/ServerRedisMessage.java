package project.tracknest.emergencyops.configuration.cache;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ServerRedisMessage {
    private String method;
    private UUID receiverId;
    protected Object payload;
}
