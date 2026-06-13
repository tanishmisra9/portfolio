import { Playfair_Display } from "next/font/google";

// Quotes-route-only display serif — imported solely under app/quotes/ so it
// doesn't ship site-wide. Inter / Space Mono stay global from app/layout.tsx.
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-playfair",
  display: "swap",
});
