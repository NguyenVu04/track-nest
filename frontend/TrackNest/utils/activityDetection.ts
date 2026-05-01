import { NativeEventEmitter, Platform } from "react-native";

export type UserActivityType = "STILL" | "WALKING" | "RUNNING" | "DRIVING" | "UNKNOWN";

let currentActivity: UserActivityType = "UNKNOWN";
let activityEmitter: NativeEventEmitter | null = null;
let activitySubscription: any = null;

function ensureEmitter() {
  if (activityEmitter || Platform.OS !== "android") return;
  
  try {
    activityEmitter = new NativeEventEmitter(
      require("react-native").NativeModules.NativeLocationModule
    );
  } catch {
    activityEmitter = null;
  }
}

export function subscribeToActivityChanges(
  callback: (activity: UserActivityType) => void
) {
  if (Platform.OS !== "android") return () => {};

  ensureEmitter();
  if (!activityEmitter) return () => {};

  activitySubscription?.remove();
  activitySubscription = activityEmitter.addListener(
    "activityChanged",
    (activity: UserActivityType) => {
      currentActivity = activity;
      callback(activity);
    }
  );

  return () => {
    activitySubscription?.remove();
    activitySubscription = null;
  };
}

export function getCurrentActivity(): UserActivityType {
  return currentActivity;
}