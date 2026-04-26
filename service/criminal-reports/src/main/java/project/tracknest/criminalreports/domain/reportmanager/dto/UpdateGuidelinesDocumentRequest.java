package project.tracknest.criminalreports.domain.reportmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGuidelinesDocumentRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Abstract is required")
    @Size(max = 500, message = "Abstract must not exceed 500 characters")
    private String abstractText;
}
