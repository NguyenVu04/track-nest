jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  hasCompletedIntroWalkthrough,
  markIntroWalkthroughCompleted,
  hasCompletedMapWalkthrough,
  markMapWalkthroughCompleted,
} from "@/utils/walkthrough";

const INTRO_KEY = "@tracknest/walkthrough_intro_v1";
const MAP_KEY = "@tracknest/walkthrough_map_v1";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("hasCompletedIntroWalkthrough", () => {
  it("returns false when flag is not set", async () => {
    expect(await hasCompletedIntroWalkthrough()).toBe(false);
  });

  it("returns true after the flag is set to 'true'", async () => {
    await AsyncStorage.setItem(INTRO_KEY, "true");
    expect(await hasCompletedIntroWalkthrough()).toBe(true);
  });

  it("returns false when AsyncStorage throws", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("IO error"));
    expect(await hasCompletedIntroWalkthrough()).toBe(false);
  });
});

describe("markIntroWalkthroughCompleted", () => {
  it("sets the intro flag to true", async () => {
    await markIntroWalkthroughCompleted();
    expect(await AsyncStorage.getItem(INTRO_KEY)).toBe("true");
  });

  it("does not throw when AsyncStorage.setItem rejects", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("write error"));
    await expect(markIntroWalkthroughCompleted()).resolves.toBeUndefined();
  });
});

describe("hasCompletedMapWalkthrough", () => {
  it("returns false when flag is not set", async () => {
    expect(await hasCompletedMapWalkthrough()).toBe(false);
  });

  it("returns true after flag is set", async () => {
    await AsyncStorage.setItem(MAP_KEY, "true");
    expect(await hasCompletedMapWalkthrough()).toBe(true);
  });
});

describe("markMapWalkthroughCompleted", () => {
  it("sets the map flag to true", async () => {
    await markMapWalkthroughCompleted();
    expect(await AsyncStorage.getItem(MAP_KEY)).toBe("true");
  });

  it("does not throw when AsyncStorage.setItem rejects", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("write error"));
    await expect(markMapWalkthroughCompleted()).resolves.toBeUndefined();
  });
});
