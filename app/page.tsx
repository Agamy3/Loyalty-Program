'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import type { Store } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)

  useEffect(() => {
    async function loadStores() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .order('name')

        if (error) throw error
        setStores(data || [])
      } catch (error) {
        console.error('Error loading stores:', error)
      } finally {
        setLoadingStores(false)
      }
    }

    loadStores()
  }, [])

  if (loading || loadingStores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              NFC Loyalty Program
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to access your account
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile.name}!</h1>
          <p className="text-gray-600 mt-2">Role: {profile.role}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{store.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{store.description}</p>
              <Button 
                onClick={() => router.push(`/store/${store.id}`)}
                className="w-full"
              >
                View Store
              </Button>
            </div>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No stores available</p>
          </div>
        )}

        <div className="mt-8 flex justify-center space-x-4">
          {profile.role === 'super_admin' && (
            <Button onClick={() => router.push('/super-admin')}>
              Super Admin Panel
            </Button>
          )}
          {(profile.role === 'owner' || profile.role === 'staff') && (
            <Button onClick={() => router.push('/admin')}>
              Admin Panel
            </Button>
          )}
          {profile.role === 'staff' && (
            <Button onClick={() => router.push('/staff')}>
              Staff Panel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
