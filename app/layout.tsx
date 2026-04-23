import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import React from 'react'

export const metadata: Metadata = {
  title: 'NFC Loyalty Program',
  description: 'Simple NFC-based loyalty system for small businesses',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
