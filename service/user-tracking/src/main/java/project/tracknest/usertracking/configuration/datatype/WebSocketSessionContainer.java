package project.tracknest.usertracking.configuration.datatype;

import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Set;

public record WebSocketSessionContainer(WebSocketSession session, Set<String> topics) {
    public void addTopic(String topic) {
        topics.add(topic);
    }

    public void removeTopic(String topic) {
        topics.remove(topic);
    }

    public boolean isClose() {
        return !session.isOpen();
    }

    public void sendMessage(String topic, WebSocketMessage<?> message) throws IOException {
        if (!topics.contains(topic)) return;
        session.sendMessage(message);
    }

    public String getId() {
        return session.getId();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WebSocketSessionContainer that)) return false;
        return getId().equals(that.getId());
    }

    @Override
    public int hashCode() {
        return getId().hashCode();
    }
}
