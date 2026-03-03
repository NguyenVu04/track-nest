package project.tracknest.emergencyops.core.datatype;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PageResponse<T>(
        List<T> items,
        long totalItems,
        int totalPages,
        int currentPage,
        int pageSize
) {}