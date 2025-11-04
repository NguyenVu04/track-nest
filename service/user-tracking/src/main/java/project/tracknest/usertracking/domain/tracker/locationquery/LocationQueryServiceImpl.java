package project.tracknest.usertracking.domain.tracker.locationquery;

import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.connection.UserConnectionManager;
import project.tracknest.usertracking.core.LocationMessage;

@Slf4j
@Service
class LocationQueryServiceImpl implements LocationQueryService, LocationMessageConsumer {
    private final UserConnectionManager connectionManager;

    public LocationQueryServiceImpl(UserConnectionManager connectionManager) {
        this.connectionManager = connectionManager;
    }

    @Override
    public void trackTaget(LocationMessage message) {
        log.info("Received location message: {}", message.id());
//        connectionManager.sendMessage();
    }

}
