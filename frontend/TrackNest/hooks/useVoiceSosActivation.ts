import { usePathname, useRouter } from "expo-router";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

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
  useEffect(() => { routerRef.current = router; }, [router]);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const shouldListenRef = useRef(false);
  const lastTriggerAtRef = useRef(0);

  const normalizedPhrases = useMemo(
    () => DEFAULT_TRIGGER_PHRASES.map((phrase) => normalize(phrase)),
    [],
  );

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Ignore if recognizer is not active.
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!enabled || appStateRef.current !== "active") return;
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      console.warn("Speech recognition is not available on this device");
      return;
    }

    shouldListenRef.current = true;

    const permission =
      await ExpoSpeechRecognitionModule.getMicrophonePermissionsAsync();

    if (!permission.granted && permission.canAskAgain) {
      const requested =
        await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      if (!requested.granted) {
        shouldListenRef.current = false;
        return;
      }
    } else if (!permission.granted) {
      shouldListenRef.current = false;
      return;
    }

    try {
      const state = await ExpoSpeechRecognitionModule.getStateAsync();
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
  const onResult = useCallback((event: { results: { transcript: string }[] }) => {
    const transcript = normalize(event.results[0]?.transcript ?? "");
    if (!transcript) return;

    const matched = normalizedPhrases.some((phrase) =>
      transcript.includes(phrase),
    );
    if (!matched) return;

    const now = Date.now();
    if (now - lastTriggerAtRef.current < 3000) return;
    lastTriggerAtRef.current = now;

    if (pathnameRef.current !== "/sos") {
      routerRef.current.push("/sos");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedPhrases]); // normalizedPhrases is stable (useMemo with [])

  useSpeechRecognitionEvent("result", onResult);

  useEffect(() => {
    startListening();

    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        if (shouldListenRef.current || enabled) {
          startListening();
        }
      } else {
        stopListening();
      }
    });

    return () => {
      subscription.remove();
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
