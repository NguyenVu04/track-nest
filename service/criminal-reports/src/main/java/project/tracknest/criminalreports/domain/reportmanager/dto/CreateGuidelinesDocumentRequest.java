package project.tracknest.criminalreports.domain.reportmanager.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGuidelinesDocumentRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Abstract is required")
    private String abstractText;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    private boolean isPublic;
}
