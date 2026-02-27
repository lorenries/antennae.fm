import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "antennae.fm",
  description: "Radio for the people",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/icon-32.png",
    apple: "/images/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#171923",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
