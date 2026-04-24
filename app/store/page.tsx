'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { Store, Point, Reward } from '@/lib/auth'

export default function StorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StorePageContent />
    </Suspense>
  )
}

function StorePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeId = searchParams.get('id')
  const { profile, loading } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [userPoints, setUserPoints] = useState<Point[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loadingStore, setLoadingStore] = useState(true)

  useEffect(() => {
    if (!storeId) {
      toast.error('Store ID is required')
      router.push('/')
      return
    }

    async function loadStoreData() {
      if (!profile) return

      try {
        // Load store data
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single()

        if (storeError) throw storeError
        setStore(storeData)

        // Load user points for this store
        const { data: pointsData, error: pointsError } = await supabase
          .from('points')
          .select('*')
          .eq('user_id', profile.id)
          .eq('store_id', storeId)
          .eq('status', 'approved')
          .order('requested_at', { ascending: false })

        if (pointsError) throw pointsError
        setUserPoints(pointsData || [])

        // Load rewards for this store
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('rewards')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('required_points', { ascending: true })

        if (rewardsError) throw rewardsError
        setRewards(rewardsData || [])
      } catch (error) {
        console.error('Error loading store data:', error)
        toast.error('Failed to load store data')
      } finally {
        setLoadingStore(false)
      }
    }

    loadStoreData()
  }, [storeId, profile, router])

  if (loading || loadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return <LoginForm />
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Store Not Found</h1>
          <p className="text-gray-600 mb-4">The store you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-gray-600">{store.description}</p>
            </div>
            <Button onClick={() => router.push('/')}>Back</Button>
          </div>
        </div>
      </div>

      {/* Store content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Points section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Points</h2>
            <div className="space-y-2">
              {userPoints.length === 0 ? (
                <p className="text-gray-500">No points yet</p>
              ) : (
                userPoints.map((point) => (
                  <div key={point.id} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">
                      {new Date(point.requested_at).toLocaleDateString()}
                    </span>
                    <span className="font-medium">+1 point</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Points:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {userPoints.length}
                </span>
              </div>
            </div>
          </div>

          {/* Rewards section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Rewards</h2>
            <div className="space-y-4">
              {rewards.length === 0 ? (
                <p className="text-gray-500">No rewards available</p>
              ) : (
                rewards.map((reward) => (
                  <div key={reward.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{reward.reward_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-600">
                        {reward.required_points} points
                      </span>
                      <Button 
                        size="sm" 
                        disabled={userPoints.length < reward.required_points}
                      >
                        Redeem
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
