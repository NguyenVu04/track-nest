package project.tracknest.criminalreports.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Entity
@Table(name = "reporter")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reporter {
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;
}
