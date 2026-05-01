import { usePathname, useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState, AppStateStatus, Keyboard } from "react-native";

const DEFAULT_TRIGGER_PHRASES = [
  "help me",
  "emergency",
  "emergency now",
  "send emergency",
  "tracknest emergency",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useVoiceSosActivation(enabled: boolean = true) {
  const router = useRouter();
  const pathname = usePathname();

  // Keep refs so event handler callbacks never need to be re-created when
  // pathname or router identity changes (which happens on every navigation).
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const shouldListenRef = useRef(false);
  const keyboardVisibleRef = useRef(false);
  const lastTriggerAtRef = useRef(0);
  const restartAfterKeyboardRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const startAttemptSeqRef = useRef(0);

  const normalizedPhrases = useMemo(
    () => DEFAULT_TRIGGER_PHRASES.map((phrase) => normalize(phrase)),
    [],
  );

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    startAttemptSeqRef.current += 1;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Ignore if recognizer is not active.
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!enabled || appStateRef.current !== "active") return;
    if (keyboardVisibleRef.current) return;
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      console.warn("Speech recognition is not available on this device");
      return;
    }

    const attemptId = ++startAttemptSeqRef.current;
    const isAttemptValid = () =>
      attemptId === startAttemptSeqRef.current &&
      shouldListenRef.current &&
      enabled &&
      appStateRef.current === "active" &&
      !keyboardVisibleRef.current;

    shouldListenRef.current = true;

    const permission =
      await ExpoSpeechRecognitionModule.getMicrophonePermissionsAsync();

    if (!isAttemptValid()) return;

    if (!permission.granted && permission.canAskAgain) {
      const requested =
        await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      if (!requested.granted || !isAttemptValid()) {
        shouldListenRef.current = false;
        return;
      }
    } else if (!permission.granted) {
      shouldListenRef.current = false;
      return;
    }

    if (!isAttemptValid()) return;

    try {
      const state = await ExpoSpeechRecognitionModule.getStateAsync();
      if (!isAttemptValid()) return;
      if (state === "recognizing" || state === "starting") return;
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
    } catch (error) {
      console.warn("Failed to start voice SOS listener", error);
    }
  }, [enabled]);

  useSpeechRecognitionEvent("end", () => {
    if (shouldListenRef.current && appStateRef.current === "active") {
      startListening();
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "not-allowed") {
      shouldListenRef.current = false;
      return;
    }

    if (shouldListenRef.current && appStateRef.current === "active") {
      startListening();
    }
  });

  // Stable callback with empty deps — reads router/pathname through refs so it
  // is never re-created on navigation, preventing listener re-registration.
  const onResult = useCallback(
    (event: { results: { transcript: string }[] }) => {
      const transcript = normalize(event.results[0]?.transcript ?? "");
      if (!transcript) return;

      const matched = normalizedPhrases.some((phrase) =>
        transcript.includes(phrase),
      );
      if (!matched) return;

      const now = Date.now();
      if (now - lastTriggerAtRef.current < 3000) return;

      if (pathnameRef.current !== "/sos") {
        routerRef.current.push("/sos");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [normalizedPhrases],
  ); // normalizedPhrases is stable (useMemo with [])

  useSpeechRecognitionEvent("result", onResult);

  useEffect(() => {
    startListening();

    const clearKeyboardRestartTimer = () => {
      if (restartAfterKeyboardRef.current) {
        clearTimeout(restartAfterKeyboardRef.current);
        restartAfterKeyboardRef.current = null;
      }
    };

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        if (shouldListenRef.current || enabled) {
          startListening();
        }
      } else {
        stopListening();
      }
    });

    // Pause recognition while the keyboard is visible so the recognizer
    // restart cycle doesn't steal focus and dismiss the keyboard.
    const keyboardShowSub = Keyboard.addListener("keyboardDidShow", () => {
      keyboardVisibleRef.current = true;
      clearKeyboardRestartTimer();
      stopListening();
    });

    const keyboardHideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisibleRef.current = false;
      if (enabled && appStateRef.current === "active") {
        clearKeyboardRestartTimer();
        // Delay restart briefly so Android can settle input focus first.
        restartAfterKeyboardRef.current = setTimeout(() => {
          if (enabled && appStateRef.current === "active") {
            startListening();
          }
        }, 300);
      }
    });

    return () => {
      appStateSub.remove();
      keyboardShowSub.remove();
      keyboardHideSub.remove();
      clearKeyboardRestartTimer();
      stopListening();
    };
  }, [enabled, startListening, stopListening]);

  useEffect(() => {
    if (!enabled) {
      stopListening();
    } else if (appStateRef.current === "active") {
      startListening();
    }
  }, [enabled, startListening, stopListening]);
}
