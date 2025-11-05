package project.tracknest.usertracking.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.usertracking.configuration.ServerIdProvider;
import project.tracknest.usertracking.connection.UserConnectionManager;

import java.security.Principal;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/tracker/location-command")
public class LocationCommandController {
    private final StringRedisTemplate redisTemplate;
    private final UserConnectionManager userConnectionManager;
    private final ServerIdProvider serverIdProvider;

    public LocationCommandController(
            UserConnectionManager userConnectionManager,
            StringRedisTemplate redisTemplate,
            ServerIdProvider serverIdProvider) {
        this.serverIdProvider = serverIdProvider;
        this.redisTemplate = redisTemplate;
        this.userConnectionManager = userConnectionManager;
    }

    public record PingResponse(String status, String message) {}

    @GetMapping("/ping")
    public String ping(Authentication authentication) {
        if (authentication != null) {
            Principal principal = (Principal) authentication.getPrincipal();
            userConnectionManager.sendMessage(UUID.fromString(principal.getName()), "ping", new PingResponse("pong", "Hello from server"));
            redisTemplate.convertAndSend(serverIdProvider.getServerId(), "pong");
            log.info("Principal: {}", authentication.getPrincipal());
        } else
            log.info("Principal is null");
        return "Hello World!";
    }

}
