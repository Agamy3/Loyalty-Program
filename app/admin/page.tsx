'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { Store, Reward, User, Point } from '@/lib/auth'

// Disable static generation to prevent undefined component errors
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [analytics, setAnalytics] = useState({
    totalPoints: 0,
    totalCustomers: 0,
    pendingRequests: 0,
    todayPoints: 0
  })
  const [loadingData, setLoadingData] = useState(true)
  const [showAddReward, setShowAddReward] = useState(false)
  const [showAddStaff, setShowAddStaff] = useState(false)

  useEffect(() => {
    if (profile?.role === 'owner') {
      fetchAdminData()
    }
  }, [profile])

  const fetchAdminData = async () => {
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

      // Get rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('store_id', profile.store_id)
        .order('required_points', { ascending: true })

      if (rewardsError) throw rewardsError
      setRewards(rewardsData || [])

      // Get staff
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('*')
        .eq('store_id', profile.store_id)
        .eq('role', 'staff')

      if (staffError) throw staffError
      setStaff(staffData || [])

      // Get analytics
      const today = new Date().toISOString().split('T')[0]
      
      const { data: allPoints, error: pointsError } = await supabase
        .from('points')
        .select('*')
        .eq('store_id', profile.store_id)

      if (pointsError) throw pointsError

      const { data: customersData, error: customersError } = await supabase
        .from('points')
        .select('user_id')
        .eq('store_id', profile.store_id)
        .eq('status', 'approved')

      if (customersError) throw customersError

      const uniqueCustomers = new Set(customersData?.map(p => p.user_id) || [])
      
      setAnalytics({
        totalPoints: allPoints?.filter(p => p.status === 'approved').length || 0,
        totalCustomers: uniqueCustomers.size,
        pendingRequests: allPoints?.filter(p => p.status === 'pending').length || 0,
        todayPoints: allPoints?.filter(p => 
          p.status === 'approved' && 
          p.requested_at.startsWith(today)
        ).length || 0
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const addReward = async (rewardData: Omit<Reward, 'id' | 'created_at' | 'updated_at' | 'store_id'>) => {
    if (!profile?.store_id) return

    try {
      const { error } = await supabase
        .from('rewards')
        .insert({
          ...rewardData,
          store_id: profile.store_id
        })

      if (error) throw error
      
      toast.success('Reward added!')
      setShowAddReward(false)
      fetchAdminData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add reward')
    }
  }

  const toggleReward = async (rewardId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: isActive })
        .eq('id', rewardId)

      if (error) throw error
      
      toast.success(`Reward ${isActive ? 'activated' : 'deactivated'}!`)
      fetchAdminData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update reward')
    }
  }

  const removeStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId)

      if (error) throw error
      
      toast.success('Staff member removed!')
      fetchAdminData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove staff')
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  if (profile.role !== 'owner') {
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          {store && (
            <p className="text-gray-600">Managing: {store.name}</p>
          )}
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-primary-600">{analytics.totalPoints}</div>
            <div className="text-sm text-gray-600">Total Points Awarded</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">{analytics.totalCustomers}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-yellow-600">{analytics.pendingRequests}</div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">{analytics.todayPoints}</div>
            <div className="text-sm text-gray-600">Points Today</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Staff Management</h2>
              <Button
                onClick={() => setShowAddStaff(true)}
                variant="primary"
                size="sm"
              >
                + Add Staff
              </Button>
            </div>
            
            {staff.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No staff members</p>
            ) : (
              <div className="space-y-2">
                {staff.map((member) => (
                  <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.phone}</p>
                    </div>
                    <Button
                      onClick={() => removeStaff(member.id)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/staff'}
              >
                📋 View Pending Requests
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = `/store/${store?.nfc_url}`}
              >
                📱 View Customer Page
              </Button>
            </div>
          </div>
        </div>

        {/* Rewards Management */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Rewards Management</h2>
              <Button
                onClick={() => setShowAddReward(true)}
                variant="primary"
                size="sm"
              >
                + Add Reward
              </Button>
            </div>
          </div>
          
          {rewards.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No rewards configured. Add your first reward!
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rewards.map((reward) => (
                <div key={reward.id} className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{reward.reward_name}</h3>
                      {reward.description && (
                        <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm font-medium text-primary-600">
                          {reward.required_points} points
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          reward.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {reward.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => toggleReward(reward.id, !reward.is_active)}
                        variant="outline"
                        size="sm"
                      >
                        {reward.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Reward Modal */}
        {showAddReward && (
          <AddRewardModal
            onClose={() => setShowAddReward(false)}
            onSubmit={addReward}
          />
        )}

        {/* Add Staff Modal */}
        {showAddStaff && (
          <AddStaffModal
            onClose={() => setShowAddStaff(false)}
            onSuccess={fetchAdminData}
          />
        )}
      </div>
    </div>
  )
}

// Add Reward Modal Component
function AddRewardModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (data: Omit<Reward, 'id' | 'created_at' | 'updated_at' | 'store_id'>) => void
}) {
  const [formData, setFormData] = useState({
    reward_name: '',
    required_points: 1,
    description: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Add New Reward</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reward Name
            </label>
            <input
              type="text"
              required
              value={formData.reward_name}
              onChange={(e) => setFormData({...formData, reward_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Points
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.required_points}
              onChange={(e) => setFormData({...formData, required_points: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active immediately
            </label>
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Reward'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Staff Modal Component
function AddStaffModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/add-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name })
      })
      
      if (response.ok) {
        toast.success('Staff member added successfully!')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add staff')
      }
    } catch (error) {
      toast.error('Failed to add staff')
    }
    
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Add Staff Member</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Staff'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
