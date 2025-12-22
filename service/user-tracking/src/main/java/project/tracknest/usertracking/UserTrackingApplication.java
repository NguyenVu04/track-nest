package project.tracknest.usertracking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UserTrackingApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserTrackingApplication.class, args);
    }

}
