'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  ClipboardCheck, ArrowLeft, Users, Building2, Layers, Loader, Save, ChevronDown
} from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

// Interfaces
interface Ward {
  id: string
  name: string
  building: string
}

interface Floor {
  id: string
  number: number
  building: string
  building_name?: string
}

interface Team {
  id: string
  name: string
}

interface FormData {
  ward: string
  floor: string
  team: string
}

export default function AddTeamAssignmentPage() {
  useAuthRedirect()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    ward: '',
    floor: '',
    team: '',
  })

  const [wards, setWards] = useState<Ward[]>([])
  const [allFloors, setAllFloors] = useState<Floor[]>([])
  const [filteredFloors, setFilteredFloors] = useState<Floor[]>([])
  const [teams, setTeams] = useState<Team[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token') || ''
      if (!token) {
        toast.error('Authentication required')
        router.push('/login')
        return
      }

      try {
        setIsLoading(true)
        const [wardRes, floorRes, teamRes] = await Promise.all([
          fetch(`${API_BASE_URL}/wards/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/floors/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/staff-teams/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!wardRes.ok || !floorRes.ok || !teamRes.ok) {
          throw new Error('Failed to fetch required data.')
        }

        const [wardData, floorData, teamData] = await Promise.all([
          wardRes.json(),
          floorRes.json(),
          teamRes.json(),
        ])

        setWards(wardData)
        setAllFloors(floorData)
        setTeams(teamData)

        if (wardData.length > 0) {
          const selectedWard = wardData[0]
          const buildingId = selectedWard.building
          const matchingFloors = floorData.filter((f: Floor) => f.building === buildingId)

          setFormData({
            ward: selectedWard.id,
            floor: matchingFloors[0]?.id || '',
            team: teamData.length > 0 ? teamData[0].id : '',
          })

          setFilteredFloors(matchingFloors)
        }
      } catch (error: any) {
        console.error(error)
        toast.error('Error loading form data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value
    const selectedWard = wards.find(w => w.id === wardId)
    const buildingId = selectedWard?.building
    const matchingFloors = allFloors.filter((f: Floor) => f.building === buildingId)

    setFormData(prev => ({
      ...prev,
      ward: wardId,
      floor: matchingFloors[0]?.id || ''
    }))

    setFilteredFloors(matchingFloors)

    // Clear field-specific errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.ward
      delete newErrors.floor
      return newErrors
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.ward) newErrors.ward = 'Ward is required'
    if (!formData.floor) newErrors.floor = 'Floor is required'
    if (!formData.team) newErrors.team = 'Team is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please correct the form errors')
      return
    }

    setIsSubmitting(true)
    const token = localStorage.getItem('access_token') || ''

    try {
      const response = await fetch(`${API_BASE_URL}/team-assignments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const msg = errorData.detail || 'Failed to create assignment'
        throw new Error(msg)
      }

      toast.success('Team assignment created successfully!')
      router.push('/admin/team_assignments')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md flex justify-center items-center h-64">
        <Loader className="animate-spin text-teal-600 w-10 h-10" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-800 ml-4">
          <ClipboardCheck className="inline-block w-5 h-5 mr-1 text-teal-600" />
          Create Team Assignment
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ward */}
        <DropdownField
          label="Ward"
          name="ward"
          value={formData.ward}
          options={wards}
          onChange={handleWardChange}
          error={errors.ward}
          icon={<Building2 className="mr-2 w-4 h-4" />}
          getLabel={(w: Ward) => w.name}
        />

        {/* Floor */}
        <DropdownField
          label="Floor"
          name="floor"
          value={formData.floor}
          options={filteredFloors}
          onChange={handleChange}
          error={errors.floor}
          icon={<Layers className="mr-2 w-4 h-4" />}
          getLabel={(f: Floor) => `Floor ${f.number}${f.building_name ? ` - ${f.building_name}` : ''}`}
        />

        {/* Team */}
        <DropdownField
          label="Team"
          name="team"
          value={formData.team}
          options={teams}
          onChange={handleChange}
          error={errors.team}
          icon={<Users className="mr-2 w-4 h-4" />}
          getLabel={(t: Team) => t.name}
        />

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-white transition-colors ${
              isSubmitting ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin mr-2" size={18} />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2" size={18} />
                Create Assignment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function DropdownField<T>({
  label,
  name,
  value,
  options,
  onChange,
  error,
  icon,
  getLabel,
}: {
  label: string
  name: string
  value: string
  options: T[]
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  error?: string
  icon?: React.ReactNode
  getLabel: (item: T) => string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
        {icon} {label} *
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="appearance-none w-full border border-gray-300 text-gray-800 rounded-lg px-4 py-2 pr-10 bg-white focus:ring-2 focus:ring-teal-500"
        >
          {options.length === 0 ? (
            <option value="">No {label.toLowerCase()}s available</option>
          ) : (
            options.map(opt => (
              <option key={(opt as any).id} value={(opt as any).id}>
                {getLabel(opt)}
              </option>
            ))
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}
