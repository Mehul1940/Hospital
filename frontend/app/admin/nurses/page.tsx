'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { 
  PlusCircle, 
  Eye, 
  Pencil, 
  Loader, 
  User, 
  Search, 
  Grip, 
  List,
  UserPlus,
  RefreshCw
} from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface Nurse {
  id: string
  name: string
  nurse_id: string
  team?: {
    name: string
  }
}

export default function NurseListPage() {
  useAuthRedirect()
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const fetchNurses = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nurses/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch nurses')
      }
      
      const data = await res.json()
      setNurses(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load nurses'
      toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNurses()
  }, [])

  const filteredNurses = nurses.filter(nurse => 
    nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nurse.nurse_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNurses()
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <User className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nurse Management</h1>
          </div>
          <p className="text-gray-600">Manage all nursing staff in your organization</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button 
              className={`p-3 ${viewMode === 'grid' ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grip className="w-5 h-5" />
            </button>
            <button 
              className={`p-3 ${viewMode === 'list' ? 'bg-teal-50 text-teal-600' : 'text-gray-500'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            aria-label="Refresh"
          >
            {refreshing ? (
              <Loader className="w-5 h-5 animate-spin text-teal-600" />
            ) : (
              <RefreshCw className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          <Link href="/admin/nurses/add">
            <button className="flex items-center px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:opacity-90 transition-all shadow-lg">
              <UserPlus className="w-5 h-5 mr-2" /> 
              <span className="hidden sm:inline">Add Nurse</span>
              <span className="sm:hidden">Add</span>
            </button>
          </Link>
        </div>
      </div>
      
      {/* Search and Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search nurses by name, email, or ID..."
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-300 focus:border-teal-400 text-gray-900 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 px-4 py-2 rounded-xl">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="ml-1 font-semibold text-teal-700">{nurses.length}</span>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl">
              <span className="text-sm text-gray-600">Showing:</span>
              <span className="ml-1 font-semibold text-blue-700">{filteredNurses.length}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm">
            <Loader className="animate-spin text-teal-600 w-12 h-12 mb-5" />
            <p className="text-xl font-medium text-gray-800 mt-4">Loading Nurse Directory</p>
            <p className="text-gray-500 mt-2">Please wait while we fetch your nursing staff</p>
        </div>

      ) : filteredNurses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
            <User className="w-10 h-10 text-teal-600" />
          </div>
          <h3 className="mt-5 text-2xl font-bold text-gray-900">
            {searchTerm ? "No matching nurses" : "No nurses found"}
          </h3>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            {searchTerm 
              ? "Try adjusting your search terms or add a new nurse" 
              : "Get started by adding your first nurse to the system"}
          </p>
          <div className="mt-7">
            <Link href="/admin/nurses/add">
              <button className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:opacity-90 transition-all shadow-md">
                <UserPlus className="w-5 h-5 mr-2" /> 
                Add New Nurse
              </button>
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNurses.map((nurse) => (
            <div 
              key={nurse.id} 
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="pr-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                      {nurse.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {nurse.nurse_id}</p>
                    
                  </div>
                  
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-600">
                    <User className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="mt-5 flex gap-3">
                  <Link href={`/admin/nurses/${nurse.id}`}>
                    <button className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </button>
                  </Link>
                  <Link href={`/admin/nurses/${nurse.id}/edit`}>
                    <button className="flex items-center text-sm font-medium text-green-600 hover:text-green-800">
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-50 to-teal-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-teal-800 uppercase tracking-wider">Nurse</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-teal-800 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-teal-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNurses.map((nurse) => (
                  <tr key={nurse.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900">{nurse.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-500">{nurse.nurse_id}</div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end space-x-3">
                        <Link href={`/admin/nurses/${nurse.id}`}>
                          <button 
                            className="p-2 text-gray-500 hover:text-white hover:bg-blue-500 rounded-lg transition-all"
                            aria-label="View nurse"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </Link>
                        
                        <Link href={`/admin/nurses/${nurse.id}/edit`}>
                          <button 
                            className="p-2 text-green-500 hover:text-white hover:bg-green-500 rounded-lg transition-all"
                            aria-label="Edit nurse"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}