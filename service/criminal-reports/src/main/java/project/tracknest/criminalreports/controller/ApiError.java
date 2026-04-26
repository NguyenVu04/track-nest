package project.tracknest.criminalreports.controller;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.List;

@Builder
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
    String timestamp,
    int status,
    String error,
    String message,
    String path,
    List<String> errors
) {}
