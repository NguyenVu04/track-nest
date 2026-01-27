package project.tracknest.usertracking.domain.tracker.locationcommand.impl;

import org.springframework.data.jpa.repository.JpaRepository;
import project.tracknest.usertracking.core.entity.Location;

interface LocationRepository extends JpaRepository<Location, Location.LocationId> {
}
