package project.tracknest.emergencyops.configuration.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import project.tracknest.emergencyops.core.datatype.EmergencyStatusMessage;
import project.tracknest.emergencyops.core.datatype.LocationMessage;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.impl.datatype.AssignedEmergencyRequestMessage;
import project.tracknest.emergencyops.domain.emergencyrequestreceiver.service.EmergencyRequestReceiverSubscriber;
import project.tracknest.emergencyops.domain.emergencyrequestmanager.service.EmergencyRequestManagerSubscriber;
import project.tracknest.emergencyops.domain.emergencyresponder.service.EmergencyResponderSubscriber;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServerRedisMessageReceiver {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final EmergencyResponderSubscriber emergencyResponderSubscriber;
    private final EmergencyRequestReceiverSubscriber emergencyRequestReceiverSubscriber;
    private final EmergencyRequestManagerSubscriber emergencyRequestManagerSubscriber;

    public void receiveMessage(String message) {
        try {
            ServerRedisMessage redisMessage = OBJECT_MAPPER.readValue(
                    message, ServerRedisMessage.class);

            log.info("Received Redis message: {}", redisMessage);

            switch (redisMessage.getMethod()) {
                case "receiveLocationMessage":
                    LocationMessage locationMessage = redisMessage.getPayload() instanceof LocationMessage
                            ? (LocationMessage) redisMessage.getPayload()
                            : OBJECT_MAPPER.convertValue(
                            redisMessage.getPayload(), LocationMessage.class);

                    emergencyResponderSubscriber.receiveLocationMessage(
                            redisMessage.getReceiverId(),
                            locationMessage
                    );
                    break;
                case "receiveEmergencyRequestMessage":
                    AssignedEmergencyRequestMessage emergencyRequestMessage = redisMessage.getPayload() instanceof AssignedEmergencyRequestMessage
                            ? (AssignedEmergencyRequestMessage) redisMessage.getPayload()
                            : OBJECT_MAPPER.convertValue(
                            redisMessage.getPayload(), AssignedEmergencyRequestMessage.class);

                    emergencyRequestReceiverSubscriber.receiveEmergencyRequestMessage(
                            redisMessage.getReceiverId(),
                            emergencyRequestMessage
                    );
                    break;
                case "receiveEmergencyStatusMessage":
                    EmergencyStatusMessage statusMessage = redisMessage.getPayload() instanceof EmergencyStatusMessage
                            ? (EmergencyStatusMessage) redisMessage.getPayload()
                            : OBJECT_MAPPER.convertValue(redisMessage.getPayload(), EmergencyStatusMessage.class);

                    emergencyRequestManagerSubscriber.receiveEmergencyStatusMessage(
                            redisMessage.getReceiverId(),
                            statusMessage
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
