import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { RadioKeystrokeListener } from "@/components/easter-eggs/radio-keystroke-listener";
import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/smooth-scroll";
import { getRadioSampleUrls } from "@/lib/radio-samples";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "lenis/dist/lenis.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tanishmisra.com"),
  title: "Tanish Misra",
  description:
    "Tanish Misra, CS student at Purdue University focused on ML/AI and software engineering. Incoming STEM Co-op at Toyota Connected Technologies.",
  icons: {
    apple: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const radioSamples = await getRadioSampleUrls();

  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-black text-neutral-200 text-base font-sans font-[120] antialiased md:text-lg">
        <div id="top" tabIndex={-1} aria-hidden="true" />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10002] focus:rounded-full focus:border focus:border-white/15 focus:bg-black focus:px-5 focus:py-3 focus:font-sans focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          Skip to content
        </a>
        <RadioKeystrokeListener samples={radioSamples} />
        <SmoothScroll>
          <SiteHeader />
          {children}
        </SmoothScroll>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
