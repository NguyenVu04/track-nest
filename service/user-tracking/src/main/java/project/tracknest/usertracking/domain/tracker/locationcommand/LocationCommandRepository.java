package project.tracknest.usertracking.domain.tracker.locationcommand;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.Location;

import java.util.UUID;

interface LocationCommandRepository extends JpaRepository<Location, Location.LocationId> {
}
