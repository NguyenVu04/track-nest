import { getCurrentActivity, subscribeToActivityChanges } from "@/utils/activityDetection";

describe("getCurrentActivity", () => {
  it("returns 'UNKNOWN' by default", () => {
    expect(getCurrentActivity()).toBe("UNKNOWN");
  });
});

describe("subscribeToActivityChanges — non-Android platform", () => {
  it("returns a no-op cleanup function on iOS", () => {
    const callback = jest.fn();
    const cleanup = subscribeToActivityChanges(callback);

    expect(typeof cleanup).toBe("function");
    cleanup(); // should not throw

    expect(callback).not.toHaveBeenCalled();
  });
});
