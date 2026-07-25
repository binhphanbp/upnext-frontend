import { Lexend } from "next/font/google";

export const lexend = Lexend({
  weight: "variable",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  variable: "--font-sans",
});
