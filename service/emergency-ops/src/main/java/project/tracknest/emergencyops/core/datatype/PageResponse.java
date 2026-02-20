package project.tracknest.emergencyops.core.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PageResponse<T>(
        T[] items,
        String nextPageToken
) {}
