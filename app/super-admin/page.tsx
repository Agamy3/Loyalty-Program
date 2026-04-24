'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { Store, User } from '@/lib/auth'


export default function SuperAdminPage() {
  const { profile, loading } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [owners, setOwners] = useState<User[]>([])
  const [analytics, setAnalytics] = useState({
    totalStores: 0,
    totalOwners: 0,
    totalStaff: 0,
    totalCustomers: 0,
    totalPoints: 0
  })
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateStore, setShowCreateStore] = useState(false)
  const [showAssignOwner, setShowAssignOwner] = useState(false)

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchSuperAdminData()
    }
  }, [profile])

  const fetchSuperAdminData = async () => {
    try {
      // Get all stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })

      if (storesError) throw storesError
      setStores(storesData || [])

      // Get all owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'owner')

      if (ownersError) throw ownersError
      setOwners(ownersData || [])

      // Get analytics
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('role')

      if (usersError) throw usersError

      const { data: allPoints, error: pointsError } = await supabase
        .from('points')
        .select('status')

      if (pointsError) throw pointsError

      const userStats = allUsers?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      setAnalytics({
        totalStores: storesData?.length || 0,
        totalOwners: userStats.owner || 0,
        totalStaff: userStats.staff || 0,
        totalCustomers: userStats.customer || 0,
        totalPoints: allPoints?.filter(p => p.status === 'approved').length || 0
      })
    } catch (error) {
      console.error('Error fetching super admin data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const createStore = async (storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('stores')
        .insert(storeData)

      if (error) throw error
      
      toast.success('Store created successfully!')
      setShowCreateStore(false)
      fetchSuperAdminData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create store')
    }
  }

  const assignOwner = async (ownerData: { phone: string; name: string; store_id: string }) => {
    try {
      // First create the user in Supabase Auth
      const { error: authError } = await supabase.auth.admin.createUser({
        phone: ownerData.phone,
        user_metadata: {
          name: ownerData.name,
          role: 'owner',
          store_id: ownerData.store_id
        }
      })

      if (authError) throw authError

      // Then create the user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          phone: ownerData.phone,
          name: ownerData.name,
          role: 'owner',
          store_id: ownerData.store_id
        })

      if (profileError) throw profileError
      
      toast.success('Owner assigned successfully!')
      setShowAssignOwner(false)
      fetchSuperAdminData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign owner')
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  if (profile.role !== 'super_admin') {
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
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-600">Platform-wide management</p>
        </div>

        {/* Platform Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-primary-600">{analytics.totalStores}</div>
            <div className="text-sm text-gray-600">Total Stores</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">{analytics.totalOwners}</div>
            <div className="text-sm text-gray-600">Store Owners</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">{analytics.totalStaff}</div>
            <div className="text-sm text-gray-600">Staff Members</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">{analytics.totalCustomers}</div>
            <div className="text-sm text-gray-600">Customers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-3xl font-bold text-yellow-600">{analytics.totalPoints}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                onClick={() => setShowCreateStore(true)}
                variant="primary"
                className="w-full justify-start"
              >
                🏪 Create New Store
              </Button>
              <Button
                onClick={() => setShowAssignOwner(true)}
                variant="outline"
                className="w-full justify-start"
              >
                👤 Assign Store Owner
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm text-green-600 font-medium">✅ Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="text-sm text-green-600 font-medium">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">RLS Policies</span>
                <span className="text-sm text-green-600 font-medium">✅ Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stores List */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Stores</h2>
          </div>
          
          {stores.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No stores created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NFC URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stores.map((store) => {
                    const storeOwner = owners.find(o => o.store_id === store.id)
                    return (
                      <tr key={store.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{store.name}</div>
                          {store.description && (
                            <div className="text-sm text-gray-500">{store.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{store.nfc_url}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {storeOwner ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{storeOwner.name}</div>
                              <div className="text-sm text-gray-500">{storeOwner.phone}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">No owner assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(store.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/store/${store.nfc_url}`, '_blank')}
                          >
                            View Store
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Store Modal */}
        {showCreateStore && (
          <CreateStoreModal
            onClose={() => setShowCreateStore(false)}
            onSubmit={createStore}
          />
        )}

        {/* Assign Owner Modal */}
        {showAssignOwner && (
          <AssignOwnerModal
            onClose={() => setShowAssignOwner(false)}
            onSubmit={assignOwner}
            stores={stores}
          />
        )}
      </div>
    </div>
  )
}

// Create Store Modal Component
function CreateStoreModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (data: Omit<Store, 'id' | 'created_at' | 'updated_at'>) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    nfc_url: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(false)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Create New Store</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NFC URL (unique identifier)
            </label>
            <input
              type="text"
              required
              value={formData.nfc_url}
              onChange={(e) => setFormData({...formData, nfc_url: e.target.value.replace(/[^a-zA-Z0-9-]/g, '')})}
              placeholder="coffee-shop-123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used in the URL: /store/{formData.nfc_url || 'your-store-id'}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Store'}
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

// Assign Owner Modal Component
function AssignOwnerModal({ onClose, onSubmit, stores }: {
  onClose: () => void
  onSubmit: (data: { phone: string; name: string; store_id: string }) => void
  stores: Store[]
}) {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    store_id: ''
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
        <h3 className="text-lg font-semibold mb-4">Assign Store Owner</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store
            </label>
            <select
              required
              value={formData.store_id}
              onChange={(e) => setFormData({...formData, store_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign Owner'}
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
