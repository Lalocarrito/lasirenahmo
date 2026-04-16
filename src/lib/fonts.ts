import { Outfit, Playfair_Display } from "next/font/google";

export const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"], // Explicitly include 400 and 700 to cover all use cases
});
