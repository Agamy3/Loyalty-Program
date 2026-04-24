-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index separately
CREATE INDEX IF NOT EXISTS idx_phone_expires ON otp_codes (phone, expires_at);

-- Enable RLS on otp_codes table
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for otp_codes
CREATE POLICY "Users can manage their own OTP codes" ON otp_codes
  FOR ALL USING (phone = current_setting('app.current_phone', true));

-- Update users table if needed
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
