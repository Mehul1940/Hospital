'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  PlusCircle, Trash2, RefreshCw, Search, AlertCircle, Mouse, 
  ChevronDown, ChevronUp, Sliders, X, Monitor, ChevronRight
} from 'lucide-react'
import { toast } from 'react-toastify'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface Device {
  id: string
  serial_number: string
  bed: {
    id: string
    number: string
    ward: {
      id: string
      name: string
    } | null
  } | null
}

export default function DeviceListPage() {
  useAuthRedirect()
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'serial_number' | 'bed'>('serial_number')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const fetchDevices = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        toast.error('Authentication required')
        return router.push('/login')
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(`Failed to fetch devices: ${res.status}`)
      }
      
      const data = await res.json()
      const devicesData = data.results || data
      
      setDevices(devicesData)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleDeleteInitiate = (device: Device) => {
    setSelectedDevice(device)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDevice) return
    
    try {
      setDeletingId(selectedDevice.id)
      setShowDeleteModal(false)
      
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        throw new Error('Authentication required')
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${selectedDevice.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Device not found')
        }
        throw new Error(`Failed to delete device: ${res.status}`)
      }
      
      setDevices(prev => prev.filter(d => d.id !== selectedDevice.id))
      toast.success('Device deleted successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete device')
    } finally {
      setDeletingId(null)
      setSelectedDevice(null)
    }
  }

  const handleSort = (field: 'serial_number' | 'bed') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: 'serial_number' | 'bed') =>
    sortField === field ? (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />) : null

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  const filteredDevices = devices.filter(device => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = (
      device.serial_number.toLowerCase().includes(search) ||
      (device.bed?.number?.toLowerCase() || '').includes(search) ||
      (device.bed?.ward?.name?.toLowerCase() || '').includes(search)
    )

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'assigned' && device.bed !== null) || 
      (statusFilter === 'unassigned' && device.bed === null)
    
    return matchesSearch && matchesStatus
  })

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    const aValue = sortField === 'serial_number' ? a.serial_number : a.bed?.number || ''
    const bValue = sortField === 'serial_number' ? b.serial_number : b.bed?.number || ''
    
    if (sortField === 'bed') {
      // Handle unassigned devices at the end
      if (!a.bed && b.bed) return sortDirection === 'asc' ? 1 : -1
      if (a.bed && !b.bed) return sortDirection === 'asc' ? -1 : 1
      if (!a.bed && !b.bed) return 0
    }
    
    return sortDirection === 'asc' 
      ? aValue.localeCompare(bValue) 
      : bValue.localeCompare(aValue)
  })

  const getStatusColor = (device: Device) => {
    return device.bed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Mouse className="text-teal-600 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Device Management</h1>
            <p className="text-sm text-gray-500">Monitor and manage all devices in the system</p>
          </div>
          {!isLoading && (
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
              {devices.length} Device{devices.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/admin/devices/add')}
          className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Device
        </button>
      </header>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by serial number, bed, or ward..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-700"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none text-gray-900"
              disabled={isLoading}
            >
              <option value="all">All Devices</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="px-3 py-2.5 border border-gray-300 rounded-lg flex items-center gap-1 hover:bg-gray-50 transition-colors text-gray-900"
              disabled={isLoading}
            >
              <X size={16} />
              <span className="text-sm">Reset</span>
            </button>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-2.5 rounded-lg flex items-center gap-1 text-sm ${
                isFilterOpen 
                  ? 'bg-teal-100 text-teal-800' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              disabled={isLoading}
            >
              <Sliders size={16} />
              <span>Sort</span>
            </button>
          </div>
        </div>

        {/* Sort Options Panel */}
        {isFilterOpen && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Sort Options</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSort('serial_number')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  sortField === 'serial_number' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Serial Number</span>
                {getSortIcon('serial_number')}
              </button>
              <button
                onClick={() => handleSort('bed')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  sortField === 'bed' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Bed Number</span>
                {getSortIcon('bed')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {(searchTerm || statusFilter !== 'all') && !isLoading && (
        <div className="mb-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Search: "{searchTerm}"
              <button 
                onClick={() => setSearchTerm('')} 
                className="ml-2 text-blue-800 hover:text-blue-900"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className={`${statusFilter === 'assigned' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm flex items-center`}>
              Status: {statusFilter}
              <button 
                onClick={() => setStatusFilter('all')} 
                className="ml-2"
              >
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border border-gray-200 p-8">
          <RefreshCw className="animate-spin text-teal-600 w-12 h-12 mb-4" />
          <p className="text-gray-600">Loading device data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      ) : sortedDevices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-400 w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No devices found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first device'}
          </p>
          <button
            onClick={() => router.push('/admin/devices/add')}
            className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-5 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Device
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white">
            {sortedDevices.map(device => (
              <div 
                key={device.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group relative"
                onClick={() => router.push(`/admin/devices/${device.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                        {device.serial_number}
                      </span>
                      <span className={`${getStatusColor(device)} text-xs px-2 py-0.5 rounded-full`}>
                        {device.bed ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                    
                    {device.bed ? (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <div className="bg-gray-100 rounded-full p-1 mr-2">
                          <Mouse className="w-4 h-4 text-gray-500" />
                        </div>
                        <span>
                          Bed {device.bed.number}
                          {device.bed.ward?.name && ` • ${device.bed.ward.name}`}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Not assigned to any bed</p>
                    )}
                  </div>
                  <div className={`p-2 rounded-full ${device.bed ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Monitor className={`w-5 h-5 ${device.bed ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/devices/${device.id}`)
                    }}
                    aria-label={`View ${device.serial_number}`}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors z-10"
                    disabled={deletingId === device.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteInitiate(device)
                    }}
                    aria-label={`Delete ${device.serial_number}`}
                  >
                    {deletingId === device.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-800">Delete Device?</h2>
                <p className="mt-2 text-gray-600">
                  Are you sure you want to delete device <span className="font-semibold">{selectedDevice.serial_number}</span>?
                  This action cannot be undone.
                </p>
                {selectedDevice.bed && (
                  <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-yellow-700 text-sm">
                      This device is currently assigned to a bed. Deleting it may affect monitoring.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}