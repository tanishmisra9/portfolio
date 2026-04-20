"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type HomeIntroContextValue = {
  introDone: boolean;
  markIntroDone: () => void;
};

const HomeIntroContext = createContext<HomeIntroContextValue | null>(null);

export function HomeIntroGateProvider({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(false);
  const markIntroDone = useCallback(() => {
    setIntroDone(true);
  }, []);
  const value = useMemo(
    () => ({ introDone, markIntroDone }),
    [introDone, markIntroDone],
  );
  return (
    <HomeIntroContext.Provider value={value}>
      {children}
    </HomeIntroContext.Provider>
  );
}

/** No-op when used outside provider (e.g. Storybook). */
export function useHomeIntroMarkDone() {
  return useContext(HomeIntroContext)?.markIntroDone ?? (() => {});
}

export function useHomeIntroDone() {
  return useContext(HomeIntroContext)?.introDone ?? true;
}
