package project.tracknest.usertracking.domain.tracker.locationquery;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import project.tracknest.usertracking.core.datatype.LocationMessage;

@Slf4j
@Service
@RequiredArgsConstructor
class LocationQueryServiceImpl implements LocationQueryService, LocationMessageConsumer {
//    private final UserConnectionManager connectionManager;

    @Override
    public void trackTaget(LocationMessage message) {
        log.info("Received location message: {}", message.id());
//        connectionManager.sendMessage();
    }

}
