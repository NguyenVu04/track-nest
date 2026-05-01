import { Alert, Platform, ToastAndroid } from "react-native";

/**
 * Shows a native toast on Android (ToastAndroid.LONG) and falls back to
 * Alert.alert on iOS, which has no native toast API.
 */
export function showToast(message: string, title?: string): void {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert(title ?? "", message);
  }
}
