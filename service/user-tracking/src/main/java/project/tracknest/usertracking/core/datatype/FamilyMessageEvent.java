package project.tracknest.usertracking.core.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FamilyMessageEvent {
    private String messageId;
    private String familyCircleId;
    private String senderId;
    private String content;
    private long sentAtMs;
}
