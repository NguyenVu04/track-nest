package project.tracknest.usertracking.core.utils;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class OtpGeneratorTest {

    @Test
    void generateOtp_hasLength16() {
        String otp = OtpGenerator.generateOtp();
        assertEquals(16, otp.length());
    }

    @Test
    void generateOtp_isAlphanumeric() {
        for (int i = 0; i < 100; i++) {
            String otp = OtpGenerator.generateOtp();
            assertTrue(otp.matches("[A-Za-z0-9]{16}"),
                    "OTP must be 16 alphanumeric chars but was: " + otp);
        }
    }

    @Test
    void generateOtp_isUnique() {
        Set<String> otps = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            otps.add(OtpGenerator.generateOtp());
        }
        assertEquals(1000, otps.size(), "Expected all 1000 OTPs to be unique");
    }

    @Test
    void otpTtlSeconds_is300() {
        assertEquals(300L, OtpGenerator.OTP_TTL_SECONDS);
    }
}
