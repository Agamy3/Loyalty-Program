'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@/lib/auth'
import { generateOTP, sendOTPEmail, storeOTP, verifyOTP, createOrUpdateUser } from '@/lib/custom-auth'

interface CustomAuthContextType {
  user: User | null
  loading: boolean
  signIn: (phone: string) => Promise<{ error?: string | undefined, otp?: string | undefined }>
  verifyOTP: (phone: string, otp: string) => Promise<{ error?: string | undefined, user?: User | undefined }>
  signOut: () => Promise<void>
}

const CustomAuthContext = createContext<CustomAuthContextType>({
  user: null,
  loading: false,
  signIn: async () => ({ error: 'Not implemented' }),
  verifyOTP: async () => ({ error: 'Not implemented' }),
  signOut: async () => {}
})

export function useCustomAuth() {
  const context = useContext(CustomAuthContext)
  if (context === undefined) {
    // Return default context during static generation
    return {
      user: null,
      loading: false,
      signIn: async () => ({ error: 'Not implemented' }),
      verifyOTP: async () => ({ error: 'Not implemented' }),
      signOut: async () => {}
    }
  }
  return context
}

export function CustomAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('loyalty_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        localStorage.removeItem('loyalty_user')
      }
    }
  }, [])

  const signIn = async (phone: string) => {
    setLoading(true)
    
    try {
      // Generate OTP
      const otp = generateOTP()
      
      // Send OTP (for demo, we'll show it in console)
      const { error: sendError } = await sendOTPEmail(phone, otp)
      if (sendError) {
        return { error: sendError }
      }
      
      // Store OTP in database
      const { error: storeError } = await storeOTP(phone, otp)
      if (storeError) {
        return { error: storeError }
      }
      
      // For demo purposes, return the OTP so user can see it
      // In production, you wouldn't return this
      return { error: undefined, otp }
    } catch (error) {
      return { error: 'Failed to send OTP' }
    } finally {
      setLoading(false)
    }
  }

  const verifyOTPCode = async (phone: string, otp: string) => {
    setLoading(true)
    
    try {
      // Verify OTP
      const { valid, error } = await verifyOTP(phone, otp)
      if (!valid) {
        return { error: error || 'Invalid OTP' }
      }
      
      // Create or update user
      const { user: userData, error: userError } = await createOrUpdateUser(phone)
      if (userError) {
        return { error: userError }
      }
      
      // Save user to state and localStorage
      setUser(userData)
      localStorage.setItem('loyalty_user', JSON.stringify(userData))
      
      return { error: undefined, user: userData }
    } catch (error) {
      return { error: 'Failed to verify OTP' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('loyalty_user')
  }

  return (
    <CustomAuthContext.Provider value={{
      user,
      loading,
      signIn,
      verifyOTP: verifyOTPCode,
      signOut
    }}>
      {children}
    </CustomAuthContext.Provider>
  )
}
