import { Alert, Platform, ToastAndroid } from "react-native";
import { showToast } from "@/utils/toast";

const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
const mockToastShow = jest.spyOn(ToastAndroid, "show").mockImplementation(() => {});

afterEach(() => {
  jest.clearAllMocks();
});

describe("showToast — iOS (default jest-expo platform)", () => {
  it("calls Alert.alert with title and message", () => {
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    showToast("Hello from toast", "Info");

    expect(mockAlert).toHaveBeenCalledWith("Info", "Hello from toast");
    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it("uses empty string as title when omitted", () => {
    Object.defineProperty(Platform, "OS", { get: () => "ios" });

    showToast("Message only");

    expect(mockAlert).toHaveBeenCalledWith("", "Message only");
  });
});

describe("showToast — Android", () => {
  it("calls ToastAndroid.show with LONG duration", () => {
    Object.defineProperty(Platform, "OS", { get: () => "android" });

    showToast("Android message");

    expect(mockToastShow).toHaveBeenCalledWith("Android message", ToastAndroid.LONG);
    expect(mockAlert).not.toHaveBeenCalled();
  });
});
