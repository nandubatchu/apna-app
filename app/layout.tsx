import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TopBar from '@/components/organisms/TopBar'
import { ManifestHandler } from '@/components/ManifestHandler'
import { GeneratedAppsProvider } from '@/lib/contexts/GeneratedAppsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Apna Apps',
  description: 'Your favorite mini apps in one place',
  manifest: "manifest.webmanifest"
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head />
      <body className={`${inter.className} antialiased h-full`}>
        {/* <ManifestHandler /> */}
        <GeneratedAppsProvider>
          <div className="min-h-[100dvh] flex flex-col">
            <div className="sticky top-0 z-50">
              <TopBar />
            </div>
            <main className="flex-1 pb-safe">
              {children}
            </main>
          </div>
        </GeneratedAppsProvider>
      </body>
    </html>
  )
}
