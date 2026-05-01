import AsyncStorage from "@react-native-async-storage/async-storage";

const INTRO_WALKTHROUGH_KEY = "@tracknest/walkthrough_intro_v1";
const MAP_WALKTHROUGH_KEY = "@tracknest/walkthrough_map_v1";

async function readFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === "true";
  } catch {
    return false;
  }
}

async function writeFlag(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, "true");
  } catch {
    // non-critical
  }
}

export async function hasCompletedIntroWalkthrough(): Promise<boolean> {
  return readFlag(INTRO_WALKTHROUGH_KEY);
}

export async function markIntroWalkthroughCompleted(): Promise<void> {
  await writeFlag(INTRO_WALKTHROUGH_KEY);
}

export async function hasCompletedMapWalkthrough(): Promise<boolean> {
  return readFlag(MAP_WALKTHROUGH_KEY);
}

export async function markMapWalkthroughCompleted(): Promise<void> {
  await writeFlag(MAP_WALKTHROUGH_KEY);
}
