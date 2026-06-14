import {
  Bricolage_Grotesque,
  Familjen_Grotesk,
  Instrument_Serif,
  Playfair_Display,
} from "next/font/google";

// Quotes-route-only typefaces — imported solely under app/quotes/ so they don't
// ship site-wide. Inter / Space Mono stay global from app/layout.tsx.
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-playfair",
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-familjen",
  display: "swap",
});
