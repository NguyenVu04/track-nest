package project.tracknest.emergencyops.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
