"use client";

import { ScatterName } from "./scatter-name";
import { HeroNameMotion } from "./hero-name-motion";

type HeroProps = {
  subtitle: string;
};

export function Hero({ subtitle }: HeroProps) {
  const [topLine = "", bottomLine = ""] = subtitle.split("\n");

  return (
    <section
      id="top"
      className="relative flex min-h-[82vh] items-center overflow-hidden px-6 py-24"
    >
      <div className="mx-auto w-full max-w-6xl text-left">
        <div className="ml-[11vw] md:ml-[9vw]">
          <HeroNameMotion>
            <div className="cursor-default select-none font-display text-[clamp(3.45rem,13.8vw,13.34rem)] font-black uppercase leading-none tracking-tighter">
              <div className="text-white translate-x-8 md:translate-x-10">
                <ScatterName text="TANISH" lineId="tanish" />
              </div>
              <div className="-mt-3 -translate-x-2 text-neutral-600 md:-mt-5 md:-translate-x-3">
                <ScatterName text="MISRA" lineId="misra" />
              </div>
            </div>
          </HeroNameMotion>
          <div className="-translate-x-2 mt-12 flex max-w-4xl flex-col gap-3 text-left font-sans text-xl font-medium leading-relaxed md:-translate-x-3 md:mt-14 md:text-2xl">
            <span className="block text-white">{topLine}</span>
            <span className="block text-neutral-400">{bottomLine}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
