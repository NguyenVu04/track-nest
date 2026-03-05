package project.tracknest.emergencyops.configuration.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.service.EmergencyRequestReceiverSubscriber;
import project.tracknest.emergencyops.domain.emergencyresponder.service.EmergencyResponderSubscriber;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServerRedisMessageReceiver {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final EmergencyResponderSubscriber emergencyResponderSubscriber;
    private final EmergencyRequestReceiverSubscriber emergencyRequestReceiverSubscriber;

    public void receiveMessage(String message) {
        try {
            ServerRedisMessage redisMessage = OBJECT_MAPPER
                    .readValue(
                            message,
                            OBJECT_MAPPER.getTypeFactory()
                                    .constructParametricType(
                                            ServerRedisMessage.class,
                                            Object.class)
                    );

            log.info("Received Redis message: {}", redisMessage);

            switch (redisMessage.getMethod()) {
                case "receiveLocationMessage":
                    emergencyResponderSubscriber.receiveLocationMessage(
                            redisMessage.getReceiverId(),
                            redisMessage.getPayload()
                    );
                    break;
                case "receiveEmergencyRequestMessage":
                    emergencyRequestReceiverSubscriber.receiveEmergencyRequestMessage(
                            redisMessage.getReceiverId(),
                            redisMessage.getPayload()
                    );
                    break;
                default:
                    log.warn("Unknown method in Redis message: {}", redisMessage.getMethod());
            }
        } catch (Exception e) {
            log.error("Failed to process message: {}", message, e);
        }
    }
}
