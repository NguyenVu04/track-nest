package project.tracknest.usertracking.configuration.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import project.tracknest.usertracking.core.datatype.FamilyMessageEvent;
import project.tracknest.usertracking.core.datatype.LocationMessage;
import project.tracknest.usertracking.domain.familymessenger.service.FamilyMessengerEventSubscriber;
import project.tracknest.usertracking.domain.tracker.locationquery.service.LocationQuerySubscriber;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServerRedisMessageReceiver {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final LocationQuerySubscriber locationQuerySubscriber;
    private final FamilyMessengerEventSubscriber familyMessengerEventSubscriber;

    public void receiveMessage(String message) {
        try {
            ServerRedisMessage redisMessage = OBJECT_MAPPER.readValue(
                    message, ServerRedisMessage.class);

            log.info("Received Redis message: {}", redisMessage);

            String method = redisMessage.getMethod();
            if (RedisMessageMethod.RECEIVE_LOCATION.equals(method)) {
                LocationMessage locationMessage = redisMessage.getPayload() instanceof LocationMessage
                        ? (LocationMessage) redisMessage.getPayload()
                        : OBJECT_MAPPER.convertValue(redisMessage.getPayload(), LocationMessage.class);
                locationQuerySubscriber.receiveLocationMessage(redisMessage.getReceiverId(), locationMessage);

            } else if (RedisMessageMethod.RECEIVE_FAMILY_MESSAGE.equals(method)) {
                FamilyMessageEvent familyMessageEvent = redisMessage.getPayload() instanceof FamilyMessageEvent
                        ? (FamilyMessageEvent) redisMessage.getPayload()
                        : OBJECT_MAPPER.convertValue(redisMessage.getPayload(), FamilyMessageEvent.class);
                familyMessengerEventSubscriber.receiveFamilyMessageEvent(
                        redisMessage.getReceiverId(), familyMessageEvent);

            } else {
                log.warn("Unknown method in Redis message: {}", method);
            }
        } catch (Exception e) {
            log.error("Failed to process message: {}", message, e);
        }
    }
}
