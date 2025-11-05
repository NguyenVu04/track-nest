package project.tracknest.usertracking.configuration;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ServerIdProvider {
    @Value("${app.server-name}")
    private String serverName;
    @Value("${app.server-uid}")
    private String serverUid;

    public String getServerId() {
        return serverName + ":" + serverUid;
    }
}
