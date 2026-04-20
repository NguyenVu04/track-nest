package project.tracknest.criminalreports.domain.chatbot.impl.datatype.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostSessionRequest {
    private UUID documentId;
}
