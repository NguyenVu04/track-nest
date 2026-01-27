package project.tracknest.usertracking.core.utils;

import java.security.SecureRandom;

public class OtpGenerator {
    public static final long OTP_TTL_SECONDS = 300;

    private static final String CHARACTERS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int OTP_LENGTH = 16;
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateOtp() {
        StringBuilder otp = new StringBuilder(OTP_LENGTH);

        for (int i = 0; i < OTP_LENGTH; i++) {
            int index = RANDOM.nextInt(CHARACTERS.length());
            otp.append(CHARACTERS.charAt(index));
        }

        return otp.toString();
    }
}
