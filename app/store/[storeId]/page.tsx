'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { Store, Point, Reward } from '@/lib/auth'

// Disable static generation to prevent undefined component errors
export const dynamic = 'force-dynamic'

export default function StorePage() {
  const params = useParams()
  const storeId = params.storeId as string
  const { profile, loading } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [userPoints, setUserPoints] = useState<Point[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loadingStore, setLoadingStore] = useState(true)

  useEffect(() => {
    if (storeId) {
      fetchStoreData()
    }
  }, [storeId])

  useEffect(() => {
    if (profile && storeId) {
      fetchUserData()
    }
  }, [profile, storeId])

  const fetchStoreData = async () => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('nfc_url', storeId)
        .single()

      if (storeError) throw storeError
      setStore(storeData)

      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_active', true)
        .order('required_points', { ascending: true })

      if (rewardsError) throw rewardsError
      setRewards(rewardsData)
    } catch (error) {
      console.error('Error fetching store data:', error)
      toast.error('Store not found')
    } finally {
      setLoadingStore(false)
    }
  }

  const fetchUserData = async () => {
    if (!profile || !store) return

    try {
      const { data: pointsData, error: pointsError } = await supabase
        .from('points')
        .select('*')
        .eq('user_id', profile.id)
        .eq('store_id', store.id)
        .order('requested_at', { ascending: false })

      if (pointsError) throw pointsError
      setUserPoints(pointsData || [])
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const requestPoint = async () => {
    if (!profile || !store) return

    try {
      const { error } = await supabase
        .from('points')
        .insert({
          user_id: profile.id,
          store_id: store.id,
          status: 'pending'
        })

      if (error) throw error
      
      toast.success('Point requested! Waiting for approval.')
      fetchUserData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to request point')
    }
  }

  const approvedPoints = userPoints.filter(p => p.status === 'approved').length
  const pendingPoints = userPoints.filter(p => p.status === 'pending').length

  if (loading || loadingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Store Not Found</h1>
          <p className="text-gray-600">This NFC tag may be invalid.</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.name}</h1>
            <p className="text-gray-600">Sign in to join the loyalty program</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Store Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{store.name}</h1>
          {store.description && (
            <p className="text-gray-600">{store.description}</p>
          )}
        </div>

        {/* Points Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Points</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{approvedPoints}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{pendingPoints}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        {/* Request Point Button */}
        <div className="mb-6">
          <Button
            onClick={requestPoint}
            className="w-full text-lg py-4"
            disabled={pendingPoints > 0}
          >
            {pendingPoints > 0 ? 'Request Pending' : '🎯 Request Point'}
          </Button>
          {pendingPoints > 0 && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Your request is being reviewed by staff
            </p>
          )}
        </div>

        {/* Rewards */}
        {rewards.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Rewards</h2>
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`p-4 rounded-lg border ${
                    approvedPoints >= reward.required_points
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{reward.reward_name}</h3>
                      {reward.description && (
                        <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary-600">
                        {reward.required_points}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                  {approvedPoints >= reward.required_points && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      ✅ Available to redeem!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {userPoints.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-2">
              {userPoints.slice(0, 5).map((point) => (
                <div key={point.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      point.status === 'approved' ? 'bg-green-500' :
                      point.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {new Date(point.requested_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${
                    point.status === 'approved' ? 'text-green-600' :
                    point.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {point.status === 'approved' ? '✓ Approved' :
                     point.status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
