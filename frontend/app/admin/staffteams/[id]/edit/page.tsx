'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { ArrowLeft, Loader2, Users, Save } from 'lucide-react'

export default function EditStaffTeamPage() {
  const { id } = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsFetching(true)
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error('Failed to fetch team details')
        }

        const data = await res.json()
        setName(data.name)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load team'
        toast.error(message)
      } finally {
        setIsFetching(false)
      }
    }

    fetchTeam()
  }, [id])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Team name cannot be empty')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to update staff team')
      }

      toast.success('Team updated successfully!')
      router.push(`/admin/staffteams/${id}`)
    } catch (err: any) {
      toast.error(err.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <Loader2 className="animate-spin w-12 h-12 text-teal-600" />
          <div className="absolute inset-0 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading team details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/admin/staffteams/${id}`)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Team Details
        </button>
      </div>

      {/* Card Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="h-15 bg-teal-500 to-blue-50 px-6 py-4 border-b border-gray-200">
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-gray-900"
                placeholder="Enter team name (e.g., Cardiology Nursing Team)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Choose a descriptive name that clearly identifies this team's specialty or assignment.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/staffteams/${id}`)}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`flex items-center px-5 py-2.5 rounded-lg text-white font-medium transition shadow-sm ${
                loading || !name.trim()
                  ? 'bg-teal-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:opacity-90'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-teal-50 border border-teal-100 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-teal-800 mb-3">Team Naming Tips</h2>
        <ul className="space-y-2 text-sm text-teal-700">
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Include specialty if applicable (e.g., Cardiology, Pediatrics)</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Specify shift if teams are time-based (e.g., Night Shift Team)</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Keep names concise but descriptive</p>
          </li>
        </ul>
      </div>
    </div>
  )
}
