'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  PlusCircle, ArrowRight, Trash2, Loader, BedDouble,
  Search, ChevronDown, ChevronUp, Sliders, X, Wrench
} from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

type Bed = {
  id: string
  number: string
  ward: { id: string; name: string }
  status: 'available' | 'occupied' | 'maintenance'
  description?: string
}

export default function BedListPage() {
  useAuthRedirect()
  const router = useRouter()
  const [beds, setBeds] = useState<Bed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Bed>('number')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('access_token') || ''
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          if (res.status === 401) {
            toast.error('Session expired. Please log in again.')
            router.push('/login')
            return
          }
          throw new Error('Failed to load beds')
        }

        const bedsData: Bed[] = await res.json()
        setBeds(bedsData)
      } catch (error: any) {
        console.error('Failed to load data:', error)
        toast.error(error.message || 'Failed to load beds. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleDeleteInitiate = (bed: Bed) => {
    setSelectedBed(bed)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBed) return

    setDeletingId(selectedBed.id)
    setShowDeleteModal(false)

    try {
      const token = localStorage.getItem('access_token') || ''
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/${selectedBed.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        toast.error('Failed to delete bed')
        return
      }

      setBeds(prev => prev.filter(b => b.id !== selectedBed.id))
      toast.success('Bed deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed. Try again.')
    } finally {
      setDeletingId(null)
      setSelectedBed(null)
    }
  }

  const handleSort = (field: keyof Bed) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredBeds = beds.filter(bed => {
    const search = searchTerm.toLowerCase()
    const matchesSearch = (
      bed.number.toLowerCase().includes(search) ||
      (bed.ward?.name?.toLowerCase() || '').includes(search) ||
      (bed.description?.toLowerCase() || '').includes(search)
    )

    const matchesStatus = statusFilter === 'all' || bed.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const sortedBeds = [...filteredBeds].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    // Handle different value types
    if (sortField === 'number') {
      const aNum = parseInt(a.number.replace(/\D/g, '')) || 0
      const bNum = parseInt(b.number.replace(/\D/g, '')) || 0
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
    }
    
    if (sortField === 'ward') {
      const aWard = a.ward?.name || ''
      const bWard = b.ward?.name || ''
      return sortDirection === 'asc' 
        ? aWard.localeCompare(bWard) 
        : bWard.localeCompare(aWard)
    }
    
    if (sortField === 'status') {
      const statusOrder = ['available', 'occupied', 'maintenance']
      const aIndex = statusOrder.indexOf(a.status)
      const bIndex = statusOrder.indexOf(b.status)
      return sortDirection === 'asc' 
        ? aIndex - bIndex
        : bIndex - aIndex
    }
    
    return 0
  })

  const getSortIcon = (field: keyof Bed) =>
    sortField === field ? (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />) : null

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 text-red-800'
      case 'available': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BedDouble className="text-teal-600 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bed Management</h1>
            <p className="text-sm text-gray-500">Manage all beds across hospital wards</p>
          </div>
          {!isLoading && (
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
              {beds.length} Bed{beds.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/admin/beds/add')}
          className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Bed
        </button>
      </header>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search beds by number, ward, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-700"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none text-gray-900"
              disabled={isLoading}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
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
                onClick={() => handleSort('number')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  sortField === 'number' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Bed Number</span>
                {getSortIcon('number')}
              </button>
              <button
                onClick={() => handleSort('ward')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  sortField === 'ward' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Ward</span>
                {getSortIcon('ward')}
              </button>
              <button
                onClick={() => handleSort('status')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  sortField === 'status' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Status</span>
                {getSortIcon('status')}
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
            <span className={`${getStatusColor(statusFilter)} px-3 py-1 rounded-full text-sm flex items-center`}>
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
          <Loader className="animate-spin text-teal-600 w-12 h-12 mb-4" />
          <p className="text-gray-600">Loading bed data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      ) : sortedBeds.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-400 w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No beds found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first bed'}
          </p>
          <button
            onClick={() => router.push('/admin/beds/add')}
            className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-5 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Bed
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white">
            {sortedBeds.map(bed => (
              <div 
                key={bed.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group relative"
                onClick={() => router.push(`/admin/beds/${bed.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                        Bed {bed.number}
                      </span>
                      <span className={`${getStatusColor(bed.status)} text-xs px-2 py-0.5 rounded-full`}>
                        {bed.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <div className="bg-gray-100 rounded-full p-1 mr-2">
                        <Wrench className="w-4 h-4 text-gray-500" />
                      </div>
                      <span>{bed.ward?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-full ${
                    bed.status === 'occupied' ? 'bg-red-100' : 
                    bed.status === 'maintenance' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <BedDouble className={`w-5 h-5 ${
                      bed.status === 'occupied' ? 'text-red-600' : 
                      bed.status === 'maintenance' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                </div>
                
                {bed.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {bed.description}
                  </p>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/beds/${bed.id}`)
                    }}
                    aria-label={`Edit ${bed.number}`}
                  >
                    <ArrowRight className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors z-10"
                    disabled={deletingId === bed.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteInitiate(bed)
                    }}
                    aria-label={`Delete ${bed.number}`}
                  >
                    {deletingId === bed.id ? (
                      <Loader className="w-4 h-4 animate-spin text-red-600" />
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
      {showDeleteModal && selectedBed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-800">Delete Bed?</h2>
                <p className="mt-2 text-gray-600">
                  Are you sure you want to delete <span className="font-semibold">Bed {selectedBed.number}</span>?
                  This action cannot be undone.
                </p>
                {selectedBed.status === 'occupied' && (
                  <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-yellow-700 text-sm">
                      This bed is currently occupied. Deleting it may affect patient records.
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
                Delete Bed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}