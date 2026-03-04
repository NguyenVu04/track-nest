package project.tracknest.emergencyops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class EmergencyOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmergencyOpsApplication.class, args);
    }

}
