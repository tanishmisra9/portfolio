import type { Metadata } from "next";
import { Inter, Inter_Tight, Poppins, Space_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { SiteChrome } from "@/components/site-chrome";
import { SiteFooter } from "@/components/site-footer";
import { getPublishedData } from "@/lib/site-content";
import { getRadioSampleUrls } from "@/lib/radio-samples";
import { getRadioTriggers } from "@/lib/radio-triggers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Static-weight face used only for the punctuation YD Gothic is excluded from (see the @font-face unicode-range in
// globals.css). The body is font-weight 120, which variable Inter renders ultra-thin (near-invisible periods). It must be
// a different family from Inter: next/font names both "Inter", so the variable face would still win the weight match.
const interPunct = Inter_Tight({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-inter-punct",
  display: "swap",
  // No generated "Inter Tight Fallback" (size-adjusted local Arial, no unicode-range): inside --font-inter-punct it would
  // catch every character Inter Tight lacks before var(--font-inter) got the chance.
  adjustFontFallback: false,
});

// Default site font. Inter / YD Gothic / system-ui stay in the Tailwind stacks as fallbacks.
const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
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
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const radioSamples = await getRadioSampleUrls();
  const radioTriggers = await getRadioTriggers();
  // The footer's links come from the published snapshot. This layout also wraps /admin, where the first snapshot
  // is created, so a missing snapshot must not throw here.
  const social = await getPublishedData().then((d) => d.portfolio.social).catch((e) => {
    console.error("[layout] footer social links unavailable:", e);
    return [];
  });

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} ${interPunct.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg text-fg text-base font-sans font-[300] antialiased md:text-lg">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {/* The theme switch is a cover-dip (ThemeToggle), so nothing fades colour-by-colour: the body and this
              wrapper both snap while covered, and Safari animates its own toolbar tint smoothly. */}
          <div className="min-h-screen bg-bg">
          <div id="top" tabIndex={-1} aria-hidden="true" />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10002] focus:rounded-none focus:border focus:border-border-strong focus:bg-bg focus:px-5 focus:py-3 focus:font-sans focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-fg focus:outline-none focus:ring-2 focus:ring-fg/70"
          >
            Skip to content
          </a>
          <MotionConfig reducedMotion="user">
          <SiteChrome radioSamples={radioSamples} radioTriggers={radioTriggers} />
          {children}
          <SiteFooter social={social} />
          </MotionConfig>
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
