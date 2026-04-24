import { supabase } from './supabase'

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash OTP for secure storage (browser-compatible)
export function hashOTP(otp: string): string {
  // Simple hash for demo purposes (in production, use proper crypto)
  let hash = 0
  for (let i = 0; i < otp.length; i++) {
    const char = otp.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

// Verify OTP against hash
export function verifyOTPHash(otp: string, hashedOTP: string): boolean {
  return hashOTP(otp) === hashedOTP
}

// Send OTP via email (using Resend or similar)
export async function sendOTPEmail(phone: string, otp: string): Promise<{ error?: string }> {
  try {
    // For demo purposes, we'll log the OTP
    // In production, you'd integrate with an email/SMS service
    console.log(`OTP for ${phone}: ${otp}`)
    
    // Example with Resend (you'd need to add Resend to your project)
    // const { data, error } = await resend.emails.send({
    //   from: 'noreply@yourapp.com',
    //   to: 'user@example.com', // You'd need to map phone to email
    //   subject: 'Your OTP Code',
    //   html: `<p>Your OTP code is: <strong>${otp}</strong></p>`
    // })
    
    return { error: undefined }
  } catch (error) {
    return { error: 'Failed to send OTP' }
  }
}

// Store OTP in database (with fallback)
export async function storeOTP(phone: string, otp: string): Promise<{ error?: string }> {
  try {
    const hashedOTP = hashOTP(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    const { error } = await supabase
      .from('otp_codes')
      .upsert({
        phone,
        otp_hash: hashedOTP,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.log('Database not available, using fallback storage')
      // Fallback: store in localStorage for demo
      const otpData = {
        phone,
        otp_hash: hashedOTP,
        expires_at: expiresAt.toISOString()
      }
      localStorage.setItem(`otp_${phone}`, JSON.stringify(otpData))
    }
    
    return { error: undefined }
  } catch (error) {
    console.log('Database not available, using fallback storage')
    // Fallback: store in localStorage for demo
    const otpData = {
      phone,
      otp_hash: hashOTP(otp),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    }
    localStorage.setItem(`otp_${phone}`, JSON.stringify(otpData))
    return { error: undefined }
  }
}

// Verify OTP from database (with fallback)
export async function verifyOTP(phone: string, otp: string): Promise<{ valid: boolean, error?: string }> {
  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('otp_hash, expires_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      // Fallback: try localStorage
      const storedOTP = localStorage.getItem(`otp_${phone}`)
      if (!storedOTP) {
        return { valid: false, error: 'OTP not found' }
      }
      
      const otpData = JSON.parse(storedOTP)
      
      // Check if OTP is expired
      if (new Date() > new Date(otpData.expires_at)) {
        localStorage.removeItem(`otp_${phone}`)
        return { valid: false, error: 'OTP expired' }
      }
      
      // Verify OTP
      const isValid = verifyOTPHash(otp, otpData.otp_hash)
      
      if (isValid) {
        localStorage.removeItem(`otp_${phone}`)
      }
      
      return { valid: isValid }
    }
    
    // Check if OTP is expired
    if (new Date() > new Date(data.expires_at)) {
      return { valid: false, error: 'OTP expired' }
    }
    
    // Verify OTP
    const isValid = verifyOTPHash(otp, data.otp_hash)
    
    if (isValid) {
      // Clean up used OTP
      await supabase
        .from('otp_codes')
        .delete()
        .eq('phone', phone)
    }
    
    return { valid: isValid }
  } catch (error) {
    // Fallback: try localStorage
    const storedOTP = localStorage.getItem(`otp_${phone}`)
    if (!storedOTP) {
      return { valid: false, error: 'OTP not found' }
    }
    
    const otpData = JSON.parse(storedOTP)
    
    // Check if OTP is expired
    if (new Date() > new Date(otpData.expires_at)) {
      localStorage.removeItem(`otp_${phone}`)
      return { valid: false, error: 'OTP expired' }
    }
    
    // Verify OTP
    const isValid = verifyOTPHash(otp, otpData.otp_hash)
    
    if (isValid) {
      localStorage.removeItem(`otp_${phone}`)
    }
    
    return { valid: isValid }
  }
}

// Create or update user profile
export async function createOrUpdateUser(phone: string, name?: string): Promise<{ user?: any, error?: string }> {
  try {
    // Generate a simple user ID based on phone (browser-compatible)
    let hash = 0
    for (let i = 0; i < phone.length; i++) {
      const char = phone.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    const userId = Math.abs(hash).toString(16).substring(0, 32)
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        phone,
        name: name || 'User',
        role: 'customer',
        store_id: null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { user: data }
  } catch (error) {
    return { error: 'Failed to create/update user' }
  }
}
