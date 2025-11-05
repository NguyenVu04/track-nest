package project.tracknest.usertracking.configuration.datatype;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RedisUserSession {
    private List<String> serverIds;
}
