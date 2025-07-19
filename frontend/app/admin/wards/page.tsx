// File: app/admin/wards/page.tsx
'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { 
  Bed, PlusCircle, Search, Sliders, ChevronDown, 
  ChevronUp, X, ArrowRight, Building, Layers, Loader2 
} from 'lucide-react'
import type { UUID, Ward, Floor, Building as BuildingType } from '@/app/utils/types'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface ExtendedWard extends Ward {
  floor_number: number
  building_name: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

type SortableField = keyof ExtendedWard

export default function WardListPage() {
  useAuthRedirect()
  const router = useRouter()
  const [wards, setWards] = useState<ExtendedWard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [sortConfig, setSortConfig] = useState<{field: SortableField; direction: 'asc'|'desc'}>({
    field: 'name',
    direction: 'asc'
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [buildingsList, setBuildingsList] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token') || ''
    try {
      setIsLoading(true)
      setError(null)
      
      const [wardsRes, floorsRes, buildingsRes] = await Promise.all([
        fetch(`${API_URL}/wards/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/floors/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/buildings/`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (!wardsRes.ok) throw new Error(`Failed to fetch wards: ${wardsRes.status}`)
      if (!floorsRes.ok) throw new Error(`Failed to fetch floors: ${floorsRes.status}`)
      if (!buildingsRes.ok) throw new Error(`Failed to fetch buildings: ${buildingsRes.status}`)

      const [rawWards, floors, buildings] = await Promise.all([
        wardsRes.json() as Promise<Ward[]>,
        floorsRes.json() as Promise<Floor[]>,
        buildingsRes.json() as Promise<BuildingType[]>
      ])

      const floorMap = new Map(floors.map(f => [f.id, f.number]))
      const buildingMap = new Map(buildings.map(b => [b.id, b.name]))

      const extendedWards = rawWards.map(w => ({
        ...w,
        floor_number: floorMap.get(w.floor) ?? 0,
        building_name: buildingMap.get(w.building) ?? "Unknown"
      }))

      setWards(extendedWards)
      setBuildingsList(['all', ...new Set(buildings.map(b => b.name))])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || "Failed to load data")
      toast.error("Data loading failed. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = useCallback((field: SortableField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const filteredWards = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return wards.filter(w => {
      const matchesSearch = 
        w.name.toLowerCase().includes(term) ||
        w.building_name.toLowerCase().includes(term) ||
        w.floor_number.toString().includes(term)
      
      const matchesBuilding = filterBuilding === 'all' || w.building_name === filterBuilding
      
      return matchesSearch && matchesBuilding
    })
  }, [wards, searchTerm, filterBuilding])

  const sortedWards = useMemo(() => {
    return [...filteredWards].sort((a, b) => {
      const field = sortConfig.field
      const valueA = a[field]
      const valueB = b[field]
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortConfig.direction === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA)
      }
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortConfig.direction === 'asc' 
          ? valueA - valueB 
          : valueB - valueA
      }
      
      return 0
    })
  }, [filteredWards, sortConfig])

  const resetFilters = useCallback(() => {
    setSearchTerm('')
    setFilterBuilding('all')
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Bed className="text-teal-600 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ward Management</h1>
            <p className="text-sm text-gray-500">Manage all wards</p>
          </div>
          <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
            {wards.length} Ward{wards.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Link
          href="/admin/wards/add"
          className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:from-teal-700 hover:to-teal-600 transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Add New Ward
        </Link>
      </header>

      {/* Search & Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by ward, building or floor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-black focus:ring-2 focus:ring-teal-500 focus:outline-none"
              aria-label="Search wards"
            />
          </div>
          
          <div className="relative">
            <select
              value={filterBuilding}
              onChange={e => setFilterBuilding(e.target.value)}
              className="w-full border px-4 py-2 rounded-lg appearance-none text-black focus:ring-2 focus:ring-teal-500 focus:outline-none"
              aria-label="Filter by building"
            >
              {buildingsList.map(b => (
                <option key={b} value={b}>
                  {b === 'all' ? 'All Buildings' : b}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors ${
                isFilterOpen 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-expanded={isFilterOpen}
              aria-controls="sort-filters"
            >
              <Sliders size={16} /> Sort
            </button>
             <button
              onClick={resetFilters}
              className="px-3 py-2.5 border border-gray-300 rounded-lg flex items-center gap-1 hover:bg-gray-50 transition-colors text-gray-900"
            >
              <X size={16} />
              <span className="text-sm">Reset</span>
            </button>
          </div>
        </div>

        {/* Sort Options */}
        {isFilterOpen && (
          <div 
            id="sort-filters"
            className="mt-4 p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="text-sm font-medium text-gray-700 mb-2">Sort by:</h3>
            <div className="flex flex-wrap gap-2">
              {(['name', 'building_name', 'floor_number'] as SortableField[]).map(field => {
                const isActive = sortConfig.field === field
                return (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-700 border hover:bg-gray-50'
                    }`}
                    aria-pressed={isActive}
                  >
                    {field.replace('_', ' ')}
                    {isActive && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp size={16} />
                        : <ChevronDown size={16} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-teal-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading wards...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error} <button 
                  onClick={fetchData}
                  className="font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      ) : sortedWards.length === 0 ? (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No wards found</h3>
          <p className="mt-1 text-gray-500">
            {filterBuilding === 'all' && searchTerm === ''
              ? "No wards have been created yet."
              : "Try adjusting your search or filter criteria."}
          </p>
          <div className="mt-6">
            <Link
              href="/admin/wards/add"
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
              Add New Ward
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedWards.map(ward => (
            <div 
              key={ward.id} 
              className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/wards/${ward.id}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold flex text-gray-600 items-center gap-2">
                    <Bed className="text-teal-600 h-5 w-5" />
                    <span>{ward.name}</span>
                  </h2>
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <Building className="mr-1.5 h-4 w-4 text-gray-400" />
                    <span>{ward.building_name}</span>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-600">
                    <Layers className="mr-1.5 h-4 w-4 text-gray-400" />
                    <span>Floor {ward.floor_number}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin/wards/${ward.id}`)
                  }}
                  className="text-teal-600 hover:text-teal-800 p-1 rounded-full hover:bg-teal-50"
                  aria-label={`View details for ${ward.name}`}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}