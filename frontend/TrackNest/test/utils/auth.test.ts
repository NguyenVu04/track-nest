jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthUnavailableError,
  isAuthUnavailableError,
  getAuthMetadata,
  getUserId,
} from "@/utils/auth";

const TOKEN_KEY = "@TrackNest:tokens";

function makeTokensJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    accessToken: "header.payload.sig",
    expiresAt: Date.now() + 300_000,
    ...overrides,
  });
}

function makeFakeJwt(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload));
  return `eyJhbGciOiJSUzI1NiJ9.${encoded}.signature`;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("AuthUnavailableError", () => {
  it("is an instance of Error", () => {
    expect(new AuthUnavailableError()).toBeInstanceOf(Error);
  });

  it("has name 'AuthUnavailableError'", () => {
    expect(new AuthUnavailableError().name).toBe("AuthUnavailableError");
  });

  it("has code AUTH_UNAVAILABLE", () => {
    expect(new AuthUnavailableError().code).toBe("AUTH_UNAVAILABLE");
  });

  it("uses a default message when none is provided", () => {
    expect(new AuthUnavailableError().message).toBe("Authentication token unavailable");
  });

  it("uses a custom message when provided", () => {
    expect(new AuthUnavailableError("custom msg").message).toBe("custom msg");
  });
});

describe("isAuthUnavailableError", () => {
  it("returns true for an AuthUnavailableError instance", () => {
    expect(isAuthUnavailableError(new AuthUnavailableError())).toBe(true);
  });

  it("returns false for a generic Error", () => {
    expect(isAuthUnavailableError(new Error("oops"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isAuthUnavailableError("string")).toBe(false);
    expect(isAuthUnavailableError(null)).toBe(false);
    expect(isAuthUnavailableError(42)).toBe(false);
    expect(isAuthUnavailableError(undefined)).toBe(false);
  });
});

describe("getAuthMetadata", () => {
  it("throws AuthUnavailableError when no token is stored", async () => {
    await expect(getAuthMetadata()).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("throws AuthUnavailableError when the token is expired", async () => {
    await AsyncStorage.setItem(
      TOKEN_KEY,
      makeTokensJson({ expiresAt: Date.now() - 5_000 }),
    );
    await expect(getAuthMetadata()).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("throws when token expires within the 60s grace margin", async () => {
    await AsyncStorage.setItem(
      TOKEN_KEY,
      makeTokensJson({ expiresAt: Date.now() + 30_000 }),
    );
    await expect(getAuthMetadata()).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("returns Bearer header for a valid, non-expired token", async () => {
    await AsyncStorage.setItem(
      TOKEN_KEY,
      makeTokensJson({ accessToken: "valid-token", expiresAt: Date.now() + 300_000 }),
    );
    const result = await getAuthMetadata();
    expect(result).toEqual({ Authorization: "Bearer valid-token" });
  });
});

describe("getUserId", () => {
  it("throws AuthUnavailableError when no token is stored", async () => {
    await expect(getUserId()).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("throws AuthUnavailableError when the token is expired", async () => {
    await AsyncStorage.setItem(
      TOKEN_KEY,
      makeTokensJson({ expiresAt: Date.now() - 5_000 }),
    );
    await expect(getUserId()).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("throws AuthUnavailableError for a malformed JWT (no dots)", async () => {
    await AsyncStorage.setItem(
      TOKEN_KEY,
      makeTokensJson({ accessToken: "notajwt" }),
    );
    await expect(getUserId()).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("throws AuthUnavailableError when JWT payload has no sub claim", async () => {
    const jwt = makeFakeJwt({ name: "test-user" });
    await AsyncStorage.setItem(TOKEN_KEY, makeTokensJson({ accessToken: jwt }));
    await expect(getUserId()).rejects.toBeInstanceOf(AuthUnavailableError);
  });

  it("extracts the sub claim from a valid JWT", async () => {
    const jwt = makeFakeJwt({ sub: "user-uuid-abc123", name: "Alice" });
    await AsyncStorage.setItem(TOKEN_KEY, makeTokensJson({ accessToken: jwt }));
    const result = await getUserId();
    expect(result).toBe("user-uuid-abc123");
  });
});
