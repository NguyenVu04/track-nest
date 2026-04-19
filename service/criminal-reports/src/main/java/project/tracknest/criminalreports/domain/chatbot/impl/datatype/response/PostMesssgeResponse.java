package project.tracknest.criminalreports.domain.chatbot.impl.datatype.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PostMesssgeResponse {
    private String response;
    private long createdAt;
}
