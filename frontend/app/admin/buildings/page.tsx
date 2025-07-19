// File: app/admin/buildings/page.tsx
'use client'

import Link from 'next/link'
import {
  Building2 as BuildingIcon,
  PlusCircle,
  Search,
  ChevronRight,
  Pencil,
  Trash2,
  Loader,
  MapPin,
  Layers,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { fetchBuildings, deleteBuilding } from '@/app/utils/api'
import { Building } from '@/app/utils/types'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

export default function BuildingsPage() {
  useAuthRedirect()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchBuildings()
        setBuildings(data)
      } catch (error) {
        toast.error('Failed to load buildings')
        console.error('Loading error:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this building?')) return
    
    setDeletingId(id)
    try {
      await deleteBuilding(id) // Changed to more semantic function name
      setBuildings(prev => prev.filter(b => b.id !== id))
      toast.success('Building deleted successfully')
    } catch (error) {
      toast.error('Failed to delete building')
      console.error('Deletion error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredBuildings = buildings.filter(b => {
    const searchLower = searchTerm.toLowerCase()
    return (
      b.name.toLowerCase().includes(searchLower) ||
      (b.address && b.address.toLowerCase().includes(searchLower)) ||
      (b.description && b.description.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BuildingIcon className="text-teal-600 h-8 w-8" />
            Building Directory
          </h1>
          <p className="text-gray-500 mt-2">
            Manage all buildings in the healthcare system
          </p>
        </div>
        
        <Link
          href="/admin/buildings/add"
          className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg hover:from-teal-700 hover:to-teal-600 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <PlusCircle className="h-5 w-5" />
          Add Building
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search buildings by name, address, or description..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <Skeleton height={25} width={250} />
              <Skeleton height={20} width={350} className="mt-3" />
              <Skeleton height={20} width={180} className="mt-2" />
              <div className="flex justify-end mt-4 gap-2">
                <Skeleton height={35} width={80} />
                <Skeleton height={35} width={80} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBuildings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <BuildingIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No buildings found</h3>
          <p className="text-gray-500 mt-2 mb-6">
            {searchTerm ? 'No matches for your search' : 'Get started by adding a new building'}
          </p>
          <Link
            href="/admin/buildings/add"
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg hover:from-teal-700 hover:to-teal-600 inline-flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Add Building
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredBuildings.map(b => (
            <li 
              key={b.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="bg-teal-50 rounded-lg p-3 flex items-center justify-center">
                    <BuildingIcon className="text-teal-600 h-10 w-10" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {b.name}
                      </h2>
                      {b.building_type && (
                        <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {b.building_type}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-1.5">
                      {b.description && (
                        <p className="text-gray-600">
                          {b.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-2">
                        {b.address && (
                          <p className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{b.address}</span>
                          </p>
                        )}
                        
                        {b.floors && (
                          <p className="flex items-center text-gray-600">
                            <Layers className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{b.floors} floors</span>
                          </p>
                        )}
                        
                        {b.hospital && (
                          <p className="flex items-center text-gray-600">
                            <span className="font-medium">Hospital:</span>
                            <span className="ml-1">{b.hospital}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                    <Link
                      href={`/admin/buildings/${b.id}/edit`}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                    >
                      {deletingId === b.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <Link
                    href={`/admin/buildings/${b.id}`}
                    className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
                  >
                    View Details <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}