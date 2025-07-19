'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

interface Team {
  id: string
  name: string
}

interface NurseFormData {
  name: string
  nurseId: string
  teamId: string
}

export default function EditNursePage() {
  const { id } = useParams()
  const router = useRouter()

  const [formData, setFormData] = useState<NurseFormData>({
    name: '',
    nurseId: '',
    teamId: '',
  })
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          toast.error('Authentication required')
          router.push('/login')
          return
        }

        const [nurseRes, teamsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/nurses/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!nurseRes.ok) throw new Error('Failed to fetch nurse data')
        if (!teamsRes.ok) throw new Error('Failed to fetch teams')

        const nurse = await nurseRes.json()
        const teamsData = await teamsRes.json()

        setFormData({
          name: nurse.name || '',
          nurseId: nurse.nurse_id || '',
          teamId: nurse.team?.toString() || '',
        })
        setTeams(teamsData)
      } catch (error: any) {
        toast.error(error.message || 'Failed to load data')
        console.error('Fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.nurseId.trim() || !formData.teamId) {
      toast.error('All fields are required')
      return
    }

    setIsUpdating(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Authentication required')
        router.push('/login')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/nurses/${id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            nurse_id: formData.nurseId,
            team: formData.teamId,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        throw new Error(errorData.message || 'Update failed')
      }

      toast.success('Nurse updated successfully!')
      router.push(`/admin/nurses/${id}`)
    } catch (error: any) {
      toast.error(error.message || 'Error updating nurse')
      console.error('Update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button
        onClick={() => router.push(`/admin/nurses/${id}`)}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Details
      </button>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit Nurse</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nurse ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nurse ID
            </label>
            <input
              name="nurseId"
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              value={formData.nurseId}
              onChange={handleChange}
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              name="name"
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Team
            </label>
            <select
              name="teamId"
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              value={formData.teamId}
              onChange={handleChange}
              required
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
