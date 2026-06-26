"use client";

import {
  createContext,
  useContext,
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
  return (
    <HomeIntroContext.Provider value={{ introDone, markIntroDone: () => setIntroDone(true) }}>
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
