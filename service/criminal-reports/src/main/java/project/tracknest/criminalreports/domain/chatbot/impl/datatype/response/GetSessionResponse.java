package project.tracknest.criminalreports.domain.chatbot.impl.datatype.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GetSessionResponse {
    private UUID documentId;
    private List<SessionMessage> messages;
    private short messageLeft;
    private long createdAtMs;
}
