'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { Point, User, Store } from '@/lib/auth'

// Disable static generation to prevent undefined component errors
export const dynamic = 'force-dynamic'

interface PointWithUser extends Point {
  user: User
}

export default function StaffPage() {
  const { profile, loading } = useAuth()
  const [pendingPoints, setPendingPoints] = useState<PointWithUser[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (profile?.role === 'staff' || profile?.role === 'owner') {
      fetchStaffData()
    }
  }, [profile])

  const fetchStaffData = async () => {
    if (!profile?.store_id) return

    try {
      // Get store info
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', profile.store_id)
        .single()

      if (storeError) throw storeError
      setStore(storeData)

      // Get pending points with user info
      const { data: pointsData, error: pointsError } = await supabase
        .from('points')
        .select(`
          *,
          user:users!inner(
            id,
            name,
            phone
          )
        `)
        .eq('store_id', profile.store_id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })

      if (pointsError) throw pointsError
      setPendingPoints(pointsData || [])
    } catch (error) {
      console.error('Error fetching staff data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const approvePoint = async (pointId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('points')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: profile.id
        })
        .eq('id', pointId)
        .eq('status', 'pending')

      if (error) throw error
      
      toast.success('Point approved!')
      fetchStaffData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve point')
    }
  }

  const rejectPoint = async (pointId: string, notes?: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('points')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: profile.id,
          notes: notes || 'Rejected by staff'
        })
        .eq('id', pointId)
        .eq('status', 'pending')

      if (error) throw error
      
      toast.success('Point rejected!')
      fetchStaffData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject point')
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  if (profile.role !== 'staff' && profile.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profile.role === 'owner' ? 'Owner Dashboard' : 'Staff Dashboard'}
          </h1>
          {store && (
            <p className="text-gray-600">{store.name}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-yellow-600">{pendingPoints.length}</div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">
              {pendingPoints.filter(p => p.user.name).length}
            </div>
            <div className="text-sm text-gray-600">Unique Customers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-primary-600">
              {profile.role === 'owner' ? 'Full Access' : 'Staff Access'}
            </div>
            <div className="text-sm text-gray-600">Your Role</div>
          </div>
        </div>

        {/* Pending Points */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Point Requests
            </h2>
          </div>
          
          {pendingPoints.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No pending requests at the moment.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingPoints.map((point) => (
                <div key={point.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {point.user.name}
                          </h3>
                          <p className="text-sm text-gray-500">{point.user.phone}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Requested {new Date(point.requested_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => approvePoint(point.id)}
                        variant="primary"
                        size="sm"
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        onClick={() => rejectPoint(point.id)}
                        variant="outline"
                        size="sm"
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {profile.role === 'owner' && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = '/admin'}
              >
                ⚙️ Manage Store Settings
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = '/admin/staff'}
              >
                👥 Manage Staff
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
