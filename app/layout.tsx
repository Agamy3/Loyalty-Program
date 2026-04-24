import './globals.css'
import type { Metadata } from 'next'
import { CustomAuthProvider } from '@/components/auth/CustomAuthProvider'
import React from 'react'

export const metadata: Metadata = {
  title: 'NFC Loyalty Program',
  description: 'A modern NFC-based loyalty program for businesses',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <CustomAuthProvider>
          {children}
        </CustomAuthProvider>
      </body>
    </html>
  )
}
