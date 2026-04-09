import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/smooth-scroll";
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
  title: "Tanish Misra",
  description:
    "Tanish Misra, CS student at Purdue University focused on ML/AI and software engineering. Incoming STEM Co-op at Toyota Connected Technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-black text-neutral-200 text-base font-sans font-[120] antialiased md:text-lg">
        <SmoothScroll>
          <SiteHeader />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
