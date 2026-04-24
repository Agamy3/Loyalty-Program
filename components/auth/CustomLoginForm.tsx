'use client'

import { useState } from 'react'
import { useCustomAuth } from './CustomAuthProvider'
import toast from 'react-hot-toast'

export function CustomLoginForm() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [demoOTP, setDemoOTP] = useState('')
  
  const { signIn, verifyOTP, loading } = useCustomAuth()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return

    const result = await signIn(phone)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('OTP sent successfully!')
      setShowOTP(true)
      // For demo purposes, show the OTP
      if ('otp' in result && result.otp) {
        setDemoOTP(result.otp)
        toast.success(`Demo OTP: ${result.otp} (check console)`)
      }
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !otp) return

    const verifyResult = await verifyOTP(phone, otp)
    
    if (verifyResult.error) {
      toast.error(verifyResult.error)
    } else {
      toast.success('Login successful!')
    }
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            This uses a custom OTP system (no SMS provider needed)
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          {demoOTP && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <strong>Demo OTP:</strong> {demoOTP}
            </div>
          )}
          
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
