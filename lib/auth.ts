import { supabase } from './supabase'
import type { Database } from './supabase'

export type User = Database['public']['Tables']['users']['Row']
export type Store = Database['public']['Tables']['stores']['Row']
export type Point = Database['public']['Tables']['points']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Return a default profile structure if table access fails
      return {
        id: user.id,
        phone: user.phone || '',
        name: user.user_metadata?.name || 'User',
        role: user.user_metadata?.role || 'customer',
        store_id: user.user_metadata?.store_id || null,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    }

    return profile
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error)
    return null
  }
}

export async function signInWithPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
    },
  })
  return { data, error }
}

export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function createUserProfile(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()
  
  return { data, error }
}
