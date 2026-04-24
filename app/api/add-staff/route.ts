import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { phone, name } = await request.json()

    if (!phone || !name) {
      return NextResponse.json(
        { error: 'Phone and name are required' },
        { status: 400 }
      )
    }

    // Get current user (must be store owner)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user profile to verify they are a store owner
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('store_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only store owners can add staff' },
        { status: 403 }
      )
    }

    // Create staff user in auth
    const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
      phone,
      user_metadata: {
        name,
        role: 'staff',
        store_id: profile.store_id
      }
    })

    if (createAuthError) {
      return NextResponse.json(
        { error: 'Failed to create staff user' },
        { status: 500 }
      )
    }

    // Create staff profile
    const { error: createProfileError } = await supabase
      .from('users')
      .insert({
        id: authData.user?.id,
        phone,
        name,
        role: 'staff',
        store_id: profile.store_id
      })

    if (createProfileError) {
      return NextResponse.json(
        { error: 'Failed to create staff profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding staff:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
