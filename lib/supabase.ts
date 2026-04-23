import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          description: string | null
          nfc_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          nfc_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          nfc_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          phone: string
          name: string
          role: 'customer' | 'staff' | 'owner' | 'super_admin'
          store_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          name: string
          role: 'customer' | 'staff' | 'owner' | 'super_admin'
          store_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          name?: string
          role?: 'customer' | 'staff' | 'owner' | 'super_admin'
          store_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      points: {
        Row: {
          id: string
          user_id: string
          store_id: string
          status: 'pending' | 'approved' | 'rejected'
          requested_at: string
          approved_at: string | null
          approved_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          store_id: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          approved_at?: string | null
          approved_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string
          approved_at?: string | null
          approved_by?: string | null
          notes?: string | null
        }
      }
      rewards: {
        Row: {
          id: string
          store_id: string
          reward_name: string
          required_points: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          reward_name: string
          required_points: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          reward_name?: string
          required_points?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
