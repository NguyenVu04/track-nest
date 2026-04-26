package project.tracknest.usertracking.core.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import project.tracknest.usertracking.core.datatype.PageToken;

import java.util.Base64;

@Slf4j
public final class PageTokenCodec {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private PageTokenCodec() {}

    public static PageToken decode(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(token);
            return MAPPER.readValue(decoded, PageToken.class);
        } catch (Exception e) {
            log.warn("Invalid page_token — treating as first page");
            return null;
        }
    }

    public static String encode(PageToken token) {
        try {
            byte[] json = MAPPER.writeValueAsBytes(token);
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(json);
        } catch (Exception e) {
            log.error("Failed to encode page_token: {}", token, e);
            throw new IllegalStateException("Failed to encode page_token", e);
        }
    }
}

