import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export const DEV_MODE_KEY = "@tracknest/dev_mode";

interface DevModeContextType {
  devMode: boolean;
  setDevMode: (enabled: boolean) => Promise<void>;
}

const DevModeContext = createContext<DevModeContextType>({
  devMode: false,
  setDevMode: async () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [devMode, setDevModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DEV_MODE_KEY).then((val) => {
      if (val === "true") setDevModeState(true);
    });
  }, []);

  const setDevMode = async (enabled: boolean) => {
    setDevModeState(enabled);
    if (enabled) {
      await AsyncStorage.setItem(DEV_MODE_KEY, "true");
    } else {
      await AsyncStorage.removeItem(DEV_MODE_KEY);
    }
  };

  return (
    <DevModeContext.Provider value={{ devMode, setDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
