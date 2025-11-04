package project.tracknest.usertracking.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.tracknest.usertracking.connection.UserConnectionManager;

import java.security.Principal;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/tracker/location-command")
public class LocationCommandController {

    private final UserConnectionManager userConnectionManager;

    public LocationCommandController(UserConnectionManager userConnectionManager) {
        this.userConnectionManager = userConnectionManager;
    }

    @GetMapping("/ping")
    public String ping(Authentication authentication) {
        if (authentication != null) {
            Principal principal = (Principal) authentication.getPrincipal();
            userConnectionManager.sendMessage(UUID.fromString(principal.getName()), "ping", "pong");
            log.info("Principal: {}", authentication.getPrincipal());
        } else
            log.info("Principal is null");
        return "Hello World!";
    }

}
