package project.tracknest.criminalreports.configuration.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ServerRedisMessageReceiver {
    public void receiveMessage(String message) {
        //TODO: Implement message handling logic
        log.info("Received message: {}", message);
    }
}
