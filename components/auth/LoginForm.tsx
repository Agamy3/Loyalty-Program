'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import toast from 'react-hot-toast'

export function LoginForm() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Try to get auth context, but provide fallback during static generation
  let authContext
  try {
    authContext = useAuth()
  } catch (error) {
    // During static generation, use fallback values
    authContext = {
      user: null,
      profile: null,
      loading: false,
      signIn: async () => ({ error: 'Not implemented' }),
      verifyOTP: async () => ({ error: 'Not implemented' }),
      signOut: async () => {}
    }
  }
  
  const { signIn, verifyOTP } = authContext

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return

    setLoading(true)
    const { error } = await signIn(phone)
    
    if (error) {
      toast.error('Failed to send OTP')
    } else {
      toast.success('OTP sent successfully!')
      setShowOTP(true)
    }
    
    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !otp) return

    setLoading(true)
    const { error } = await verifyOTP(phone, otp)
    
    if (error) {
      toast.error('Invalid OTP')
    } else {
      toast.success('Login successful!')
    }
    
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {showOTP ? 'Enter OTP' : 'Login / Sign Up'}
      </h2>
      
      {!showOTP ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={6}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowOTP(false)}
            className="w-full text-gray-600 py-2 px-4 hover:text-gray-800"
          >
            Back to Phone
          </button>
        </form>
      )}
    </div>
  )
}
