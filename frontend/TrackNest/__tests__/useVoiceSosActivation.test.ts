/**
 * Use case under test:
 *  - EMERGENCY-UC-01: Activate Emergency Alert by voice.
 *
 * Strategy: the hook registers a "result" callback via useSpeechRecognitionEvent.
 * We capture that callback from the mock and invoke it manually to simulate the
 * speech engine returning a transcript — no real microphone or native module needed.
 */

const mockPush = jest.fn();
const mockPathname = jest.fn<string, []>().mockReturnValue("/map");

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

// useSpeechRecognitionEvent registers callbacks; we capture them per event name.
jest.mock("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: {
    start: jest.fn(),
    stop: jest.fn(),
    isRecognitionAvailable: jest.fn().mockReturnValue(true),
    getMicrophonePermissionsAsync: jest
      .fn()
      .mockResolvedValue({ granted: true, canAskAgain: false }),
    getStateAsync: jest.fn().mockResolvedValue("inactive"),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));

// Spy on AppState and Keyboard from react-native so the hook's event
// subscriptions don't fail in the jsdom environment.
import { AppState, Keyboard } from "react-native";

import { renderHook, act } from "@testing-library/react-native";
import { useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useVoiceSosActivation } from "@/hooks/useVoiceSosActivation";

const mockUseSpeechRecognitionEvent = useSpeechRecognitionEvent as jest.Mock;

/** Returns the callback registered for a given speech event, or undefined. */
function getCapturedHandler(event: string): ((e: any) => void) | undefined {
  const call = mockUseSpeechRecognitionEvent.mock.calls
    .slice()
    .reverse()
    .find(([ev]: [string]) => ev === event);
  return call?.[1];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname.mockReturnValue("/map");
  jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() } as any);
  jest.spyOn(Keyboard, "addListener").mockReturnValue({ remove: jest.fn() } as any);
});

describe("useVoiceSosActivation — EMERGENCY-UC-01", () => {
  it("navigates to /sos when a trigger phrase is detected", async () => {
    renderHook(() => useVoiceSosActivation(true));

    const onResult = getCapturedHandler("result");
    expect(onResult).toBeDefined();

    act(() => {
      onResult!({ results: [{ transcript: "help me please" }] });
    });

    expect(mockPush).toHaveBeenCalledWith("/sos");
  });

  it("does not navigate when the transcript contains no trigger phrase", () => {
    renderHook(() => useVoiceSosActivation(true));

    const onResult = getCapturedHandler("result");
    act(() => {
      onResult!({ results: [{ transcript: "hello world, nice day" }] });
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate when already on /sos", () => {
    mockPathname.mockReturnValue("/sos");
    renderHook(() => useVoiceSosActivation(true));

    const onResult = getCapturedHandler("result");
    act(() => {
      onResult!({ results: [{ transcript: "emergency now" }] });
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("recognises all default trigger phrases", () => {
    const phrases = [
      "help me",
      "emergency",
      "emergency now",
      "send emergency",
      "tracknest emergency",
    ];

    for (const phrase of phrases) {
      jest.clearAllMocks();
      mockPathname.mockReturnValue("/map");

      renderHook(() => useVoiceSosActivation(true));
      const onResult = getCapturedHandler("result");

      act(() => {
        onResult!({ results: [{ transcript: phrase }] });
      });

      expect(mockPush).toHaveBeenCalledWith("/sos");
    }
  });
});
