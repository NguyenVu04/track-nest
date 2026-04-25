package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Data
@Entity
@Table(name = "emergency_request_status")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequestStatus {
    @Id
    @Column(name = "name", nullable = false, updatable = false, length = 15)
    private String name;

    public boolean is(Status status) {
        return this.name.equals(status.getValue());
    }

    @Getter
    public enum Status {
        PENDING("PENDING"),
        REJECTED("REJECTED"),
        ACCEPTED("ACCEPTED"),
        CLOSED("CLOSED");

        private final String value;

        Status(String value) {
            this.value = value;
        }
    }
}
