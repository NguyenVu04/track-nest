package project.tracknest.usertracking.configuration;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class PrincipalHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        if (request instanceof ServletServerHttpRequest servletRequest) {
            Principal principal = servletRequest.getPrincipal();
            attributes.put("principal", principal);
            return principal;
        }

        return super.determineUser(request, wsHandler, attributes);
    }
}
