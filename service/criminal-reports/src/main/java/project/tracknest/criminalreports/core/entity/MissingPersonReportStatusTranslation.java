package project.tracknest.criminalreports.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "missing_person_report_status_translation")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingPersonReportStatusTranslation {
    @EmbeddedId
    private MissingPersonReportStatusTranslationId id;

    @Column(name = "value", nullable = false)
    private String value;

    @Data
    @Embeddable
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MissingPersonReportStatusTranslationId {
        @Column(name = "status_name", nullable = false, updatable = false, length = 15)
        private String statusName;

        @Column(name = "language_code", nullable = false, updatable = false, length = 2)
        private String languageCode;
    }
}
