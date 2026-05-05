jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: "192.168.1.100:8081" } },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getServiceUrl,
  getBaseUrl,
  getEmergencyUrl,
  getCriminalUrl,
  getGrpcUrl,
  SERVICE_URL_KEY,
  EMERGENCY_URL_KEY,
  CRIMINAL_URL_KEY,
  GRPC_URL_KEY,
} from "@/utils/serviceUrl";

beforeEach(async () => {
  await AsyncStorage.clear();
  delete process.env.EXPO_PUBLIC_SERVICE_URL;
  delete process.env.EXPO_PUBLIC_EMERGENCY_URL;
  delete process.env.EXPO_PUBLIC_CRIMINAL_URL;
});

describe("getServiceUrl", () => {
  it("returns the stored URL when set", async () => {
    await AsyncStorage.setItem(SERVICE_URL_KEY, "http://stored.local");
    expect(await getServiceUrl()).toBe("http://stored.local");
  });

  it("ignores blank stored values and falls through to env", async () => {
    await AsyncStorage.setItem(SERVICE_URL_KEY, "   ");
    process.env.EXPO_PUBLIC_SERVICE_URL = "http://env.local";
    expect(await getServiceUrl()).toBe("http://env.local");
  });

  it("returns the env URL when no stored value exists", async () => {
    process.env.EXPO_PUBLIC_SERVICE_URL = "http://env.local";
    expect(await getServiceUrl()).toBe("http://env.local");
  });

  it("falls back to the Expo dev-host derived URL", async () => {
    expect(await getServiceUrl()).toBe("http://192.168.1.100");
  });
});

describe("getBaseUrl", () => {
  it("is an alias for getServiceUrl", async () => {
    process.env.EXPO_PUBLIC_SERVICE_URL = "http://base.local";
    expect(await getBaseUrl()).toBe("http://base.local");
  });
});

describe("getEmergencyUrl", () => {
  it("returns the stored emergency URL when set", async () => {
    await AsyncStorage.setItem(EMERGENCY_URL_KEY, "http://emergency.local");
    expect(await getEmergencyUrl()).toBe("http://emergency.local");
  });

  it("returns the env emergency URL when no stored value", async () => {
    process.env.EXPO_PUBLIC_EMERGENCY_URL = "http://env-emergency.local";
    expect(await getEmergencyUrl()).toBe("http://env-emergency.local");
  });

  it("falls back to getServiceUrl when neither stored nor env", async () => {
    process.env.EXPO_PUBLIC_SERVICE_URL = "http://base.local";
    expect(await getEmergencyUrl()).toBe("http://base.local");
  });
});

describe("getCriminalUrl", () => {
  it("returns the stored criminal URL when set", async () => {
    await AsyncStorage.setItem(CRIMINAL_URL_KEY, "http://criminal.local");
    expect(await getCriminalUrl()).toBe("http://criminal.local");
  });

  it("returns env criminal URL when no stored value", async () => {
    process.env.EXPO_PUBLIC_CRIMINAL_URL = "http://env-criminal.local";
    expect(await getCriminalUrl()).toBe("http://env-criminal.local");
  });

  it("falls back to getServiceUrl", async () => {
    process.env.EXPO_PUBLIC_SERVICE_URL = "http://base.local";
    expect(await getCriminalUrl()).toBe("http://base.local");
  });
});

describe("getGrpcUrl", () => {
  it("returns the stored gRPC URL verbatim when set", async () => {
    await AsyncStorage.setItem(GRPC_URL_KEY, "http://grpc.local:8800");
    expect(await getGrpcUrl()).toBe("http://grpc.local:8800");
  });

  it("appends :8800 in DEV mode (jest-expo sets __DEV__ = true)", async () => {
    process.env.EXPO_PUBLIC_SERVICE_URL = "http://base.local";
    const result = await getGrpcUrl();
    expect(result).toBe("http://base.local:8800");
  });
});
