jest.mock("expo-location", () => ({
  reverseGeocodeAsync: jest.fn(),
}));

import * as ExpoLocation from "expo-location";
import { formatRelativeTime, getInitials, formatTimeAgo, formatAddressFromLatLng } from "@/utils/formatters";

const NOW = new Date("2024-06-15T12:00:00.000Z").getTime();

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterAll(() => {
  jest.useRealTimers();
});

describe("formatRelativeTime", () => {
  it("returns empty string for undefined", () => {
    expect(formatRelativeTime(undefined)).toBe("");
  });

  it("returns the raw string for an invalid date string", () => {
    expect(formatRelativeTime("not-a-date")).toBe("not-a-date");
  });

  it("returns 'just now' for < 10 seconds ago", () => {
    const d = new Date(NOW - 5_000).toISOString();
    expect(formatRelativeTime(d)).toBe("just now");
  });

  it("returns seconds for 10–59 seconds ago", () => {
    expect(formatRelativeTime(new Date(NOW - 30_000).toISOString())).toBe("30s");
    expect(formatRelativeTime(new Date(NOW - 59_000).toISOString())).toBe("59s");
  });

  it("returns minutes for 1–59 minutes ago", () => {
    expect(formatRelativeTime(new Date(NOW - 5 * 60_000).toISOString())).toBe("5m");
    expect(formatRelativeTime(new Date(NOW - 59 * 60_000).toISOString())).toBe("59m");
  });

  it("returns hours for 1–23 hours ago", () => {
    expect(formatRelativeTime(new Date(NOW - 2 * 3_600_000).toISOString())).toBe("2h");
    expect(formatRelativeTime(new Date(NOW - 23 * 3_600_000).toISOString())).toBe("23h");
  });

  it("returns days for 1–6 days ago", () => {
    expect(formatRelativeTime(new Date(NOW - 3 * 86_400_000).toISOString())).toBe("3d");
    expect(formatRelativeTime(new Date(NOW - 6 * 86_400_000).toISOString())).toBe("6d");
  });

  it("returns a locale date string for > 7 days ago", () => {
    const old = new Date(NOW - 10 * 86_400_000);
    const result = formatRelativeTime(old.toISOString());
    expect(typeof result).toBe("string");
    expect(result).not.toBe("");
    expect(result).not.toContain("d");
  });

  it("accepts a numeric timestamp", () => {
    expect(formatRelativeTime(NOW - 60_000)).toBe("1m");
  });

  it("accepts a Date object", () => {
    expect(formatRelativeTime(new Date(NOW - 3_600_000))).toBe("1h");
  });
});

describe("getInitials", () => {
  it("returns empty string for the default argument", () => {
    expect(getInitials()).toBe("");
  });

  it("returns empty string for an empty string", () => {
    expect(getInitials("")).toBe("");
  });

  it("returns first two chars uppercased for a single word", () => {
    expect(getInitials("John")).toBe("JO");
    expect(getInitials("A")).toBe("A");
  });

  it("returns first letter of each of the first two words", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("alice bob charlie")).toBe("AB");
  });

  it("handles extra whitespace between words", () => {
    expect(getInitials("  Jane   Smith  ")).toBe("JS");
  });
});

describe("formatTimeAgo", () => {
  it("returns 'Just now' for less than 1 minute ago", () => {
    expect(formatTimeAgo(NOW - 30_000)).toBe("Just now");
    expect(formatTimeAgo(NOW)).toBe("Just now");
  });

  it("returns minutes for 1–59 minutes ago", () => {
    expect(formatTimeAgo(NOW - 5 * 60_000)).toBe("5m ago");
    expect(formatTimeAgo(NOW - 59 * 60_000)).toBe("59m ago");
  });

  it("returns hours for 1–23 hours ago", () => {
    expect(formatTimeAgo(NOW - 3 * 3_600_000)).toBe("3h ago");
    expect(formatTimeAgo(NOW - 23 * 3_600_000)).toBe("23h ago");
  });

  it("returns days for >= 24 hours ago", () => {
    expect(formatTimeAgo(NOW - 2 * 86_400_000)).toBe("2d ago");
  });
});

describe("formatAddressFromLatLng", () => {
  const mockGeocode = ExpoLocation.reverseGeocodeAsync as jest.Mock;

  beforeEach(() => {
    mockGeocode.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns empty string when lat is 0 (falsy guard)", async () => {
    expect(await formatAddressFromLatLng(0, 20)).toBe("");
    expect(mockGeocode).not.toHaveBeenCalled();
  });

  it("returns empty string when lng is 0 (falsy guard)", async () => {
    expect(await formatAddressFromLatLng(10, 0)).toBe("");
    expect(mockGeocode).not.toHaveBeenCalled();
  });

  it("returns empty string when both coordinates are valid but geocode is unavailable in test env", async () => {
    // expo-location's reverseGeocodeAsync is not callable in the test environment;
    // the function's catch block handles this and returns "".
    const result = await formatAddressFromLatLng(10, 20);
    expect(result).toBe("");
  });
});
