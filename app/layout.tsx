import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Apna",
  description: "Discover and launch apps in the Apna ecosystem",
  generator: "Next.js",
  manifest: "/manifest.webmanifest",
  keywords: ["apna", "nostr"],
  authors: [{ name: "Yadunandan Batchu" }],
  icons: [
    { rel: "apple-touch-icon", url: "/icon-192x192.png" },
    { rel: "icon", url: "/icon-192x192.png" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Apna",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: "#368564",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overscroll-none touch-manipulation",
          "min-h-[100dvh]", // dynamic viewport height
          "selection:bg-[#368564] selection:text-white", // selection color
          inter.variable
        )}
      >
        <Suspense>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
