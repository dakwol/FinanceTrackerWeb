import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "./providers";
import "./globals.scss";

export const metadata: Metadata = {
  title: {
    default: "Семейный бюджет",
    template: "%s · Семейный бюджет",
  },
  description: "Семейный финансовый трекер на базе Google Sheets",
  applicationName: "Семейный бюджет",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Семейный бюджет",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7057e8",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
