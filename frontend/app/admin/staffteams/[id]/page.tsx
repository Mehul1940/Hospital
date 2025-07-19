'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { 
  Loader, 
  ArrowLeft, 
  Users, 
  Pencil, 
  UserPlus,
  Trash2,
  ChevronRight
} from 'lucide-react'

export default function ViewStaffTeamPage() {
  const { id } = useParams()
  const [team, setTeam] = useState<{ id: string; name: string; nurse_count?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Team not found')
          } else {
            throw new Error('Failed to fetch team details')
          }
          return
        }
        
        const data = await res.json()
        setTeam(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load team details'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return
    
    setIsDeleting(true)
    
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to delete team')
      }

      toast.success('Team deleted successfully')
      router.push('/admin/staffteams')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete team'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader className="animate-spin w-12 h-12 text-teal-600" />
        <p className="mt-4 text-lg font-medium text-gray-700">Loading team details...</p>
        <p className="text-gray-500 mt-1">Please wait while we fetch the information</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Error loading team</h3>
              <p className="mt-2 text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/admin/staffteams')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Teams
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-gray-900">Team Not Found</h3>
          <p className="mt-2 text-gray-500">The team you're looking for doesn't exist or may have been removed.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/admin/staffteams')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Teams
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/staffteams')}
            className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Teams
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Staff Team Details</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/admin/staffteams/${id}/edit`)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Team
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-70"
          >
            {isDeleting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-50 to-teal-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-teal-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
              <p className="text-sm text-gray-600">Team ID: {team.id}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-gray-500 mr-2" />
                Team Information
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Team Name</h4>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{team.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Team ID</h4>
                  <p className="text-gray-700 font-mono text-sm mt-1">{team.id}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserPlus className="h-5 w-5 text-gray-500 mr-2" />
                  Assigned Nurses
                </h3>
                <button 
                  onClick={() => router.push(`/admin/staffteams/${id}/nurses`)}
                  className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                >
                  Manage
                </button>
              </div>
              <div className="flex items-center justify-center h-32 bg-white border border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Users className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-gray-500 mt-2">
                    {team.nurse_count ? `${team.nurse_count} nurses assigned` : 'No nurses assigned'}
                  </p>
                  <button 
                    onClick={() => router.push(`/admin/staffteams/${id}/nurses`)}
                    className="mt-2 text-sm text-teal-600 hover:text-teal-800 font-medium"
                  >
                    Assign nurses →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Assignments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Ward Assignments</h4>
                <p className="text-gray-500 text-sm">No wards assigned</p>
                <button 
                  onClick={() => router.push(`/admin/staffteams/${id}/assignments`)}
                  className="mt-3 text-sm text-teal-600 hover:text-teal-800 font-medium"
                >
                  Assign to wards →
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Floor Assignments</h4>
                <p className="text-gray-500 text-sm">No floors assigned</p>
                <button 
                  onClick={() => router.push(`/admin/staffteams/${id}/assignments`)}
                  className="mt-3 text-sm text-teal-600 hover:text-teal-800 font-medium"
                >
                  Assign to floors →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-500">
          <p>Team created on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
