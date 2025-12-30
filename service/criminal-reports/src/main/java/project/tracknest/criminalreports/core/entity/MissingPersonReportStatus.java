package project.tracknest.criminalreports.core.entity;

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
@Table(name = "missing_person_report_status")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingPersonReportStatus {
    @Id
    @Column(name = "name", nullable = false, updatable = false, length = 15)
    private String name;
}
