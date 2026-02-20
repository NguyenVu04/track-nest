package project.tracknest.emergencyops.core.datatype;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PageRequest(
        int pageSize,
        String pageToken,
        String sortBy,
        String sortOrder,
        Long fromMs,
        Long toMs,
        String query
) {}
