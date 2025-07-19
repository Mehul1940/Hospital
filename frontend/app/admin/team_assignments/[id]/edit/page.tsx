'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Edit3, Save, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Entity, TeamAssignment } from '@/app/utils/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export default function EditTeamAssignment() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [options, setOptions] = useState({
    teams: [] as Entity[],
    wards: [] as Entity[],
    floors: [] as Entity[],
  })

  const [formData, setFormData] = useState<TeamAssignment>({
    id: '',
    team: '',
    ward: '',
    floor: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.push('/login')
          return
        }

        const headers = { Authorization: `Bearer ${token}` }

        const [teamsRes, wardsRes, floorsRes, assignmentRes] = await Promise.all([
          fetch(`${API_BASE_URL}/staff-teams/`, { headers }),
          fetch(`${API_BASE_URL}/wards/`, { headers }),
          fetch(`${API_BASE_URL}/floors/`, { headers }),
          fetch(`${API_BASE_URL}/team-assignments/${id}/`, { headers }),
        ])

        if (!assignmentRes.ok) {
          const error = await assignmentRes.json()
          throw new Error(error.message || 'Failed to fetch assignment')
        }

        const [teams, wards, floors, assignment] = await Promise.all([
          teamsRes.ok ? teamsRes.json() : [],
          wardsRes.ok ? wardsRes.json() : [],
          floorsRes.ok ? floorsRes.json() : [],
          assignmentRes.json(),
        ])

        setOptions({ teams, wards, floors })
        setFormData(assignment)
      } catch (error: any) {
        console.error('Data fetch error:', error)
        toast.error(error.message || 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${API_BASE_URL}/team-assignments/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          team: formData.team,
          ward: formData.ward,
          floor: formData.floor,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Update failed')
      }

      toast.success('Assignment updated successfully!')
      router.push(`/admin/team_assignments/${id}`)
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(error.message || 'Failed to update assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-teal-600 size-8" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Edit3 className="text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">Edit Assignment</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Selector */}
        <div className="space-y-2">
          <label htmlFor="team" className="block text-sm font-medium text-gray-700">
            Team
          </label>
          <select
            id="team"
            name="team"
            value={formData.team}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            required
            disabled={isSubmitting}
          >
            <option value="">Select team</option>
            {options.teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ward Selector */}
        <div className="space-y-2">
          <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
            Ward
          </label>
          <select
            id="ward"
            name="ward"
            value={formData.ward}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            required
            disabled={isSubmitting}
          >
            <option value="">Select ward</option>
            {options.wards.map(ward => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor Selector */}
        <div className="space-y-2">
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
            Floor
          </label>
          <select
            id="floor"
            name="floor"
            value={formData.floor}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
            required
            disabled={isSubmitting}
          >
            <option value="">Select floor</option>
            {options.floors.map(floor => (
              <option key={floor.id} value={floor.id}>
                Floor {floor.number}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin size-5" />
            ) : (
              <Save className="size-5" />
            )}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>

          <Link href={`/admin/team_assignments/${id}`} legacyBehavior>
            <a className="flex items-center gap-1 text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg transition">
              <ArrowLeft className="size-5" />
              Cancel
            </a>
          </Link>
        </div>
      </form>
    </div>
  )
}
