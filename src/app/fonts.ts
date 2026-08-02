import localFont from "next/font/local";

export const lexend = localFont({
  src: "./fonts/Lexend-Variable.ttf",
  weight: "100 900",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  variable: "--font-sans",
});
