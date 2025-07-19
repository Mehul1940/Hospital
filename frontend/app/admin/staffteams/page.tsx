'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Pencil,
  Eye,
  Plus,
  Users,
  Search,
  ChevronRight,
  PlusCircle
} from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface StaffTeam {
  id: string
  name: string
}

export default function StaffTeamListPage() {
  useAuthRedirect()
  const [teams, setTeams] = useState<StaffTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!res.ok) {
          throw new Error('Failed to fetch teams')
        }
        
        const data = await res.json()
        setTeams(data)
      } catch (error) {
        console.error('Error fetching teams:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [])

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Teams</h1>
          </div>
          <p className="text-gray-600">Manage nursing teams and their assignments</p>
        </div>
        
        <Link href="/admin/staffteams/add">
          <button className="flex items-center px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition shadow-md">
            <PlusCircle className="w-5 h-5 mr-2" /> Add Team
          </button>
        </Link>
      </div>
      
      {/* Search and Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 px-3 py-1.5 rounded-lg">
              <span className="text-sm text-gray-600">Total teams:</span>
              <span className="ml-1 text-gray-900">{teams.length}</span>
            </div>
            <div className="bg-green-50 px-3 py-1.5 rounded-lg">
              <span className="text-sm text-gray-600">Showing:</span>
              <span className="ml-1 text-gray-900">{filteredTeams.length}</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 w-10 h-10 mb-4" />
          <p className="text-gray-700 text-lg">Loading staff teams...</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-gray-900">
            {searchTerm ? "No teams found" : "No staff teams yet"}
          </h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            {searchTerm 
              ? "Try adjusting your search query" 
              : "Create your first nursing team to get started"}
          </p>
          <div className="mt-6">
            <Link href="/admin/staffteams/add">
              <button className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                <PlusCircle className="w-4 h-4 mr-2" /> Create Team
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => (
            <div 
              key={team.id} 
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="flex items-center text-teal-700 gap-2 mb-1">
                      <Users  />{team.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">Team ID: {team.id.substring(0, 8)}...</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link href={`/admin/staffteams/${team.id}`}>
                      <button 
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        aria-label="View team details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </Link>
                    
                    <Link href={`/admin/staffteams/${team.id}/edit`}>
                      <button 
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-teal-50 rounded-lg transition"
                        aria-label="Edit team"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <Link 
                    href={`/admin/staffteams/${team.id}`}
                    className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <span>View team details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
