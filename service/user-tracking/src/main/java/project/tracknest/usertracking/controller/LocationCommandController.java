package project.tracknest.usertracking.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("")
public class LocationCommandController {

    @GetMapping("/ping")
    public String ping(Authentication authentication) {
        if (authentication != null)
            log.info("Principal: {}", authentication.getPrincipal());
        else
            log.info("Principal is null");
        return "Hello World!";
    }

}
