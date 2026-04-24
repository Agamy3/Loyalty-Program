import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function addStaffMember(phone: string, name: string) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get user profile to verify they are a store owner
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('store_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'owner') {
      throw new Error('Only store owners can add staff')
    }

    // For static export, we'll need to use Supabase Edge Functions
    // This is a placeholder - you'll need to create the actual Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/add-staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await supabase.auth.getSession().then(session => session.data.session?.access_token)}`
      },
      body: JSON.stringify({ phone, name })
    })

    if (!response.ok) {
      throw new Error('Failed to add staff member')
    }

    return await response.json()
  } catch (error) {
    console.error('Error adding staff:', error)
    throw error
  }
}
