import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Apna Apps',
  description: 'Your favorite mini apps in one place',
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
      <body className={`${inter.className} antialiased h-full`}>
        <div className="min-h-[100dvh] flex flex-col">
          <main className="flex-1 pb-safe">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
