'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  PlusCircle, ArrowRight, Trash2, Loader, Blinds,
  Search, ChevronDown, ChevronUp, Building, Sliders, X
} from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

interface Floor {
  id: string
  number: number
  building: string
  buildingName?: string
  level: number
  description?: string
}

interface Building {
  id: string
  name: string
}

export default function FloorListPage() {
  useAuthRedirect()
  const router = useRouter()
  const [floors, setFloors] = useState<Floor[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Floor>('number')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [isBuildingLoading, setIsBuildingLoading] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token') || ''
        const [floorsRes, buildingsRes] = await Promise.all([
          fetch(`${API_URL}/floors/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/buildings/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (!floorsRes.ok || !buildingsRes.ok) {
          if (floorsRes.status === 401 || buildingsRes.status === 401) {
            toast.error('Session expired. Please log in again.')
            router.push('/login')
            return
          }
          throw new Error('Failed to load data')
        }

        const floorsData: Floor[] = await floorsRes.json()
        const buildingsData: Building[] = await buildingsRes.json()

        // Create building name map for quick lookups
        const buildingNameMap = buildingsData.reduce((acc, building) => {
          acc[building.id] = building.name
          return acc
        }, {} as Record<string, string>)

        // Enhance floors with building names
        const enhancedFloors = floorsData.map(floor => ({
          ...floor,
          buildingName: buildingNameMap[floor.building] || 'Unknown Building'
        }))

        setFloors(enhancedFloors)
        setBuildings(buildingsData)
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load data. Please try again later.')
      } finally {
        setIsLoading(false)
        setIsBuildingLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleDeleteInitiate = (floor: Floor) => {
    setSelectedFloor(floor)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedFloor) return

    setDeletingId(selectedFloor.id)
    setShowDeleteModal(false)

    try {
      const token = localStorage.getItem('access_token') || ''
      const response = await fetch(`${API_URL}/floors/${selectedFloor.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        toast.error('Failed to delete floor')
        return
      }

      setFloors(prev => prev.filter(f => f.id !== selectedFloor.id))
      toast.success('Floor deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed. Try again.')
    } finally {
      setDeletingId(null)
      setSelectedFloor(null)
    }
  }

  const handleSort = (field: keyof Floor) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredFloors = floors.filter(floor => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      (floor.number?.toString() || '').includes(search) ||
      (floor.level?.toString() || '').includes(search) ||
      (floor.buildingName && floor.buildingName.toLowerCase().includes(search)) ||
      (floor.description && floor.description.toLowerCase().includes(search))

    const matchesBuilding = buildingFilter === 'all' || floor.building === buildingFilter
    return matchesSearch && matchesBuilding
  })

  const sortedFloors = [...filteredFloors].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue)
    }
    
    return 0
  })

  const getSortIcon = (field: keyof Floor) =>
    sortField === field ? (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />) : null

  const resetFilters = () => {
    setSearchTerm('')
    setBuildingFilter('all')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Blinds className="text-teal-600 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Floor Management</h1>
            <p className="text-sm text-gray-500">Manage all floors across your buildings</p>
          </div>
          <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
            {floors.length} Floor{floors.length !== 1 && 's'}
          </span>
        </div>
        <button
          onClick={() => router.push('/admin/floors/add')}
          className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Floor
        </button>
      </header>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search floors by number, level, building, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-700"
            />
          </div>

          <div className="relative">
            <select
              value={buildingFilter}
              onChange={e => setBuildingFilter(e.target.value)}
              className="w-full border px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none text-gray-900"
              disabled={isBuildingLoading}
            >
              <option value="all">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="px-3 py-2.5 border border-gray-300 rounded-lg flex items-center gap-1 hover:bg-gray-50 transition-colors text-gray-900"
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
                <span>Floor Number</span>
                {getSortIcon('number')}
              </button>
              <button
                onClick={() => handleSort('level')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  sortField === 'level' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Level</span>
                {getSortIcon('level')}
              </button>
              <button
                onClick={() => handleSort('buildingName')}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${
                  sortField === 'buildingName' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>Building</span>
                {getSortIcon('buildingName')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters */}
      {(searchTerm || buildingFilter !== 'all') && (
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
          {buildingFilter !== 'all' && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
              Building: {buildings.find(b => b.id === buildingFilter)?.name || buildingFilter}
              <button 
                onClick={() => setBuildingFilter('all')} 
                className="ml-2 text-purple-800 hover:text-purple-900"
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
          <p className="text-gray-600">Loading floor data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      ) : sortedFloors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="text-gray-400 w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No floors found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || buildingFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first floor'}
          </p>
          <button
            onClick={() => router.push('/admin/floors/add')}
            className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-5 py-2.5 rounded-lg inline-flex items-center gap-2 shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Floor
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white">
            {sortedFloors.map(floor => (
              <div 
                key={floor.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group relative"
                onClick={() => router.push(`/admin/floors/${floor.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">
                        Floor {floor.number}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        Level {floor.level}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Building className="w-4 h-4 mr-1" />
                      <span>{floor.buildingName || floor.building}</span>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-full p-1">
                    <Blinds className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
                
                {floor.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {floor.description}
                  </p>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/floors/${floor.id}`)
                    }}
                    aria-label={`Edit ${floor.number}`}
                  >
                    <ArrowRight className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors z-10"
                    disabled={deletingId === floor.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteInitiate(floor)
                    }}
                    aria-label={`Delete ${floor.number}`}
                  >
                    {deletingId === floor.id ? (
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
      {showDeleteModal && selectedFloor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-800">Delete Floor?</h2>
                <p className="mt-2 text-gray-600">
                  Are you sure you want to delete <span className="font-semibold">Floor {selectedFloor.number}</span>?
                  This action cannot be undone and all associated data will be permanently removed.
                </p>
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
                Delete Floor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}