package project.tracknest.criminalreports.configuration.security;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.criminalreports.core.entity.Reporter;

import java.util.UUID;

public interface SecurityReporterRepository extends JpaRepository<Reporter, UUID> {
}
