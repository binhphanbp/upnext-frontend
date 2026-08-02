import type { Metadata } from "next";

import { routing } from "@/i18n/routing";

import "../globals.css";
import { Providers } from "../providers";

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: "/pwa/icon-192.png",
    apple: "/pwa/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
