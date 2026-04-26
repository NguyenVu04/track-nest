package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "emergency_request_status_translation")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequestStatusTranslation {
    @EmbeddedId
    private EmergencyRequestStatusTranslationId id;

    @Column(name = "value", nullable = false)
    private String value;

    @Data
    @Embeddable
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyRequestStatusTranslationId {
        @Column(name = "status_name", nullable = false, updatable = false, length = 15)
        private String name;

        @Column(name = "language_code", nullable = false, updatable = false, length = 2)
        private String languageCode;
    }
}
