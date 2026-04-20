package project.tracknest.criminalreports.domain.chatbot.impl.datatype.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostMessageRequest {
    @Size(min = 4, max = 255, message = "Message must be between 1 and 255 characters")
    private String message;

    private UUID sessionId;
}
