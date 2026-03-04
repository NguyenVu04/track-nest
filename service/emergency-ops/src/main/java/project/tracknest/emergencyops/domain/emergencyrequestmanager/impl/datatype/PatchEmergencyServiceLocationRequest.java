package project.tracknest.emergencyops.domain.emergencyrequestmanager.impl.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PatchEmergencyServiceLocationRequest (
    double latitudeDegrees,
    double longitudeDegrees
){}