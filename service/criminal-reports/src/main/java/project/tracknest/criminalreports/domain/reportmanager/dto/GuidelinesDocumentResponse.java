package project.tracknest.criminalreports.domain.reportmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuidelinesDocumentResponse {
    private UUID id;
    private String title;
    private String abstractText;
    private String content;
    private OffsetDateTime createdAt;
    private UUID reporterId;
    @JsonProperty("isPublic")
    private boolean publicFlag;
}
