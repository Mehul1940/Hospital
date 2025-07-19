'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Save, Loader, ArrowLeft, ChevronDown, User, Building2, Blinds } from 'lucide-react'
import type { User as UserType, Building as BuildingType } from '@/app/utils/types'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

export default function AddFloorPage() {
  useAuthRedirect()
  const router = useRouter()
  const [formData, setFormData] = useState({
    number: '',
    building: '',
    supervisor: ''
  })
  const [buildings, setBuildings] = useState<BuildingType[]>([])
  const [supervisors, setSupervisors] = useState<UserType[]>([])
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
        const [buildingRes, userRes] = await Promise.all([
          fetch(`${API_BASE_URL}/buildings/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/users/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!buildingRes.ok || !userRes.ok) {
          const buildingError = await buildingRes.json().catch(() => null)
          const userError = await userRes.json().catch(() => null)
          throw new Error(
            `Failed to load data: ${buildingError?.detail || buildingRes.status} | ${userError?.detail || userRes.status}`
          )
        }

        const buildingData = await buildingRes.json()
        const userData = await userRes.json()
        
        setBuildings(buildingData)
        setSupervisors(userData.filter((user: UserType) => user.role === 'supervisor'))
        
        // Set initial building if available
        if (buildingData.length > 0) {
          setFormData(prev => ({ ...prev, building: buildingData[0].id }))
        }
      } catch (error: any) {
        console.error('Fetch error:', error)
        toast.error(error.message || 'Failed to load form data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if(!formData.number || isNaN(Number(formData.number))) {
      newErrors.number = 'Valid floor number is required'
    } else if (Number(formData.number) < 0) {
      newErrors.number = 'Floor number cannot be negative'
    }
    
    if (!formData.building) {
      newErrors.building = 'Building selection is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }
    
    setIsSubmitting(true)
    const token = localStorage.getItem('access_token') || ''
    
    try {
      const response = await fetch(`${API_BASE_URL}/floors/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          number: Number(formData.number),
          building: formData.building,
          supervisor: formData.supervisor || null,
        }),
      })

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json()
          const serverErrors = Object.entries(errorData).map(
            ([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`
          )
          toast.error(`Validation error: ${serverErrors.join('; ')}`)
          return
        } else if (response.status === 401) {
          toast.error('Session expired. Please log in again.')
          router.push('/login')
          return
        }
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      toast.success('Floor created successfully!')
      router.push('/admin/floors')
    } catch (error: any) {
      console.error('Submission error:', error)
      toast.error(error.message || 'Failed to create floor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md flex justify-center items-center h-64">
        <Loader className="animate-spin text-teal-600 w-12 h-12" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
          aria-label="Go back"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-800 ml-4">Add New Floor</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Blinds className="mr-2 w-4 h-4" /> Floor Number *
            </label>
            <input
              id="number"
              name="number"
              type="number"
              min="0"
              value={formData.number}
              onChange={handleChange}
              className={`w-full border border-gray-600 text-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-600 focus:border-gray-700 bg-white${
                errors.number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 1"
              required
            />
            {errors.number && <p className="mt-1 text-sm text-red-600">{errors.number}</p>}
          </div>

          <div>
            <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Building2 className="mr-2 w-4 h-4" /> Building *
            </label>
            <div className="relative">
              <select
                id="building"
                name="building"
                value={formData.building}
                onChange={handleChange}
                className={`w-full border border-gray-600 text-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-600 focus:border-gray-700 bg-white ${
                  errors.building ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                disabled={buildings.length === 0}
              >
                {buildings.length === 0 ? (
                  <option value="">No buildings available</option>
                ) : (
                  buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={20} />
              </div>
            </div>
            {errors.building && <p className="mt-1 text-sm text-red-600">{errors.building}</p>}
            {buildings.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No buildings found. Please create a building first.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="mr-2 w-4 h-4" /> Floor Supervisor
            </label>
            <div className="relative">
              <select
                id="supervisor"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                 className="appearance-none w-full border border-gray-600 text-gray-800 bg-white rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-teal-600 focus:border-gray-700"
              >
                <option value="">Select a supervisor (optional)</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.username}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown size={20} />
              </div>
            </div>
            {supervisors.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No supervisors found. You can assign one later.
              </p>
            )}
          </div>
        </div>

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
              isSubmitting
                ? 'bg-teal-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
            disabled={isSubmitting || buildings.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin mr-2" size={18} />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2" size={18} />
                Create Floor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}