import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import React from 'react'

export const metadata: Metadata = {
  title: 'NFC Loyalty Program',
  description: 'A modern NFC-based loyalty program for businesses',
  viewport: 'width=device-width, initial-scale=1',
}

// Disable static generation to prevent undefined component errors
export const dynamic = 'force-dynamic'

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
