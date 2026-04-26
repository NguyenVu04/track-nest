package project.tracknest.usertracking.core.utils;

import org.junit.jupiter.api.Test;
import project.tracknest.usertracking.core.datatype.PageToken;

import static org.junit.jupiter.api.Assertions.*;

class PageTokenCodecTest {

    @Test
    void encode_decode_roundtrip() {
        PageToken original = new PageToken(1234567890L, "some-uuid-id");
        String encoded = PageTokenCodec.encode(original);
        PageToken decoded = PageTokenCodec.decode(encoded);

        assertNotNull(decoded);
        assertEquals(original.lastCreatedAtMs(), decoded.lastCreatedAtMs());
        assertEquals(original.lastId(), decoded.lastId());
    }

    @Test
    void decode_null_returnsNull() {
        assertNull(PageTokenCodec.decode(null));
    }

    @Test
    void decode_blank_returnsNull() {
        assertNull(PageTokenCodec.decode(""));
        assertNull(PageTokenCodec.decode("   "));
    }

    @Test
    void decode_invalidBase64_returnsNull() {
        assertNull(PageTokenCodec.decode("!!!not-valid-base64!!!"));
    }

    @Test
    void encode_producesUrlSafeBase64_withNoPadding() {
        PageToken token = new PageToken(9999L, "test-id");
        String encoded = PageTokenCodec.encode(token);

        assertFalse(encoded.contains("+"), "URL-safe base64 must not contain '+'");
        assertFalse(encoded.contains("/"), "URL-safe base64 must not contain '/'");
        assertFalse(encoded.contains("="), "Padding must be stripped");
        assertFalse(encoded.isBlank());
    }

    @Test
    void decode_validToken_preservesFields() {
        PageToken token = new PageToken(System.currentTimeMillis(), "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
        String encoded = PageTokenCodec.encode(token);
        PageToken decoded = PageTokenCodec.decode(encoded);

        assertNotNull(decoded);
        assertEquals(token.lastCreatedAtMs(), decoded.lastCreatedAtMs());
        assertEquals(token.lastId(), decoded.lastId());
    }
}
