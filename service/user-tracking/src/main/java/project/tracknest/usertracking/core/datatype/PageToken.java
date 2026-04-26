package project.tracknest.usertracking.core.datatype;

import java.security.SecureRandom;

public record PageToken(long lastCreatedAtMs, String lastId) {
}
