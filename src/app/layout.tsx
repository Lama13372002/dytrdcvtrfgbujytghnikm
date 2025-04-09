import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SettingsProvider } from '@/lib/settings-context'
import { HomeSettingsProvider } from '@/lib/home-settings-context'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'RoyalTransfer - Комфортные трансферы из Калининграда в Европу',
  description: 'Трансферы из Калининграда в города Европы',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <SettingsProvider>
          <HomeSettingsProvider>
            {children}
            <Toaster position="top-right" richColors />
          </HomeSettingsProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
