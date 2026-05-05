jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSavedKey, saveKey } from "@/utils/storage";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe("saveKey", () => {
  it("serializes and persists the value", async () => {
    await saveKey("my-key", { hello: "world", count: 42 });
    const raw = await AsyncStorage.getItem("my-key");
    expect(JSON.parse(raw!)).toEqual({ hello: "world", count: 42 });
  });

  it("handles primitive values", async () => {
    await saveKey("num-key", 123);
    const raw = await AsyncStorage.getItem("num-key");
    expect(JSON.parse(raw!)).toBe(123);
  });

  it("handles arrays", async () => {
    await saveKey("arr-key", [1, 2, 3]);
    const raw = await AsyncStorage.getItem("arr-key");
    expect(JSON.parse(raw!)).toEqual([1, 2, 3]);
  });

  it("does not throw when AsyncStorage.setItem rejects", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("disk full"));
    await expect(saveKey("fail-key", "value")).resolves.toBeUndefined();
  });
});

describe("loadSavedKey", () => {
  it("returns null when key does not exist", async () => {
    const result = await loadSavedKey<string>("nonexistent");
    expect(result).toBeNull();
  });

  it("deserializes and returns the stored object", async () => {
    await AsyncStorage.setItem("obj-key", JSON.stringify({ foo: 42 }));
    const result = await loadSavedKey<{ foo: number }>("obj-key");
    expect(result).toEqual({ foo: 42 });
  });

  it("deserializes and returns a stored array", async () => {
    await AsyncStorage.setItem("arr-key", JSON.stringify([10, 20]));
    const result = await loadSavedKey<number[]>("arr-key");
    expect(result).toEqual([10, 20]);
  });

  it("returns null when the stored value is invalid JSON", async () => {
    await AsyncStorage.setItem("bad-key", "{invalid json");
    const result = await loadSavedKey("bad-key");
    expect(result).toBeNull();
  });

  it("returns null when AsyncStorage.getItem rejects", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("read error"));
    const result = await loadSavedKey("any-key");
    expect(result).toBeNull();
  });
});
