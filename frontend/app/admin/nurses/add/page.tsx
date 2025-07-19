'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { ArrowLeft, Loader2, Plus, User, Users, Clipboard, ChevronDown, PlusCircle } from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface Team {
  id: string
  name: string
}

export default function AddNursePage() {
  useAuthRedirect()
  const [name, setName] = useState('')
  const [nurseId, setNurseId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [teamsLoading, setTeamsLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true)
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!res.ok) {
          throw new Error('Failed to fetch teams')
        }
        
        const data = await res.json()
        setTeams(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load teams'
        toast.error(message)
      } finally {
        setTeamsLoading(false)
      }
    }
    fetchTeams()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !nurseId.trim() || !teamId) {
      toast.error('All fields are required')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nurses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, nurse_id: nurseId, team: teamId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to add nurse')
      }

      toast.success('Nurse added successfully!')
      router.push('/admin/nurses')
    } catch (err: any) {
      toast.error(err.message || 'Error adding nurse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <button 
        onClick={() => router.push('/admin/nurses')} 
        className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Nurses
      </button>

      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-teal-100 p-3 rounded-lg">
              <User className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Add New Nurse</h1>
              <p className="text-sm text-gray-600 mt-1">Register a new nursing staff member to your organization</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nurse ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Clipboard className="w-5 h-5" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-gray-900"
                value={nurseId}
                onChange={(e) => setNurseId(e.target.value)}
                required
                placeholder="e.g., NUR-12345"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">Unique identifier for the nurse</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-gray-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter nurse's full name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Team <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Users className="w-5 h-5" />
              </div>
              <select
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition appearance-none bg-no-repeat bg-[center_right_1rem] text-gray-900"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                disabled={teamsLoading}
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
            {teamsLoading && (
              <p className="mt-2 text-sm text-gray-500 flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading teams...
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || teamsLoading}
              className={`flex items-center px-5 py-2.5 rounded-lg text-white font-medium transition shadow-sm ${
                loading || teamsLoading 
                  ? 'bg-teal-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:opacity-90'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Adding Nurse...
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add Nurse
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-teal-50 border border-teal-100 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-teal-800 mb-3">Nurse Registration Tips</h2>
        <ul className="space-y-2 text-sm text-teal-700">
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Use a consistent ID format for all nurses</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Assign to appropriate teams based on specialty</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Ensure all required fields are completed</p>
          </li>
        </ul>
      </div>
    </div>
  )
}
