"use client"
// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { App } from 'konsta/react';

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Apna",
//   description: "Apna",
//   generator: "Next.js",
//   manifest: "/manifest.webmanifest",
//   keywords: ["apna"],
//   themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
//   authors: [
//     { name: "Yadunandan Batchu" },
//   ],
//   viewport:
//     "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
//   icons: [
//     { rel: "apple-touch-icon", url: "/icon-192x192.png" },
//     { rel: "icon", url: "/icon-192x192.png" },
//   ],
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/x-icon" href="favicon.ico"></link>
      </head>

      <App theme="material">
        <body className={inter.className}>{children}</body>
      </App>
    </html>
  );
}

