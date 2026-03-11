import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface AppUIContextValue {
  hideFAB: boolean;
  setHideFAB: (hide: boolean) => void;
  moduleNameOverride: string | null;
  setModuleNameOverride: (name: string | null) => void;
  headerTabs: React.ReactNode | null;
  setHeaderTabs: (tabs: React.ReactNode | null) => void;
}

const AppUIContext = createContext<AppUIContextValue>({
  hideFAB: false,
  setHideFAB: () => {},
  moduleNameOverride: null,
  setModuleNameOverride: () => {},
  headerTabs: null,
  setHeaderTabs: () => {},
});

export function AppUIProvider({ children }: { children: React.ReactNode }) {
  const [hideFAB, setHideFABState] = useState(false);
  const [moduleNameOverride, setModuleNameOverrideState] = useState<
    string | null
  >(null);
  const [headerTabs, setHeaderTabsState] = useState<React.ReactNode | null>(
    null,
  );
  const setHideFAB = useCallback((hide: boolean) => setHideFABState(hide), []);
  const setModuleNameOverride = useCallback(
    (name: string | null) => setModuleNameOverrideState(name),
    [],
  );
  const setHeaderTabs = useCallback(
    (tabs: React.ReactNode | null) => setHeaderTabsState(tabs),
    [],
  );
  return (
    <AppUIContext.Provider
      value={{
        hideFAB,
        setHideFAB,
        moduleNameOverride,
        setModuleNameOverride,
        headerTabs,
        setHeaderTabs,
      }}
    >
      {children}
    </AppUIContext.Provider>
  );
}

export function useAppUI() {
  return useContext(AppUIContext);
}
