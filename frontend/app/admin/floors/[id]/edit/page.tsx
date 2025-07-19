'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Loader, Save, ArrowLeft, Building, Layers, ChevronDown, User2, Blinds } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

interface BuildingOption {
  id: string
  name: string
}

interface SupervisorOption {
  id: string
  username: string
}

export default function EditFloorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [formData, setFormData] = useState({
    number: '',
    building: '',
    supervisor: ''
  })

  const [buildings, setBuildings] = useState<BuildingOption[]>([])
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isBuildingLoading, setIsBuildingLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token') || ''
      try {
        setIsLoading(true)

        // Fetch buildings
        const buildingsRes = await fetch(`${API_URL}/buildings/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!buildingsRes.ok) throw new Error('Failed to load buildings')
        const buildingsData = await buildingsRes.json()
        setBuildings(buildingsData)

        // Fetch supervisors
        const supervisorRes = await fetch(`${API_URL}/users/?role=supervisor`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!supervisorRes.ok) throw new Error('Failed to load supervisors')
        const supervisorData = await supervisorRes.json()
        setSupervisors(supervisorData)

        // Fetch floor data
        const floorRes = await fetch(`${API_URL}/floors/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!floorRes.ok) throw new Error('Failed to load floor data')
        const floorData = await floorRes.json()

        setFormData({
          number: floorData.number?.toString() || '',
          building: floorData.building || '',
          supervisor: floorData.supervisor || ''
        })
      } catch (error) {
        console.error('Fetch error:', error)
        toast.error('Failed to load data')
      } finally {
        setIsLoading(false)
        setIsBuildingLoading(false)
      }
    }

    fetchData()
  }, [id])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.number) {
      newErrors.number = 'Floor number is required'
    } else if (isNaN(Number(formData.number))) {
      newErrors.number = 'Must be a number'
    }

    if (!formData.building) {
      newErrors.building = 'Building selection is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
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
      const response = await fetch(`${API_URL}/floors/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          number: Number(formData.number),
          building: formData.building,
          supervisor: formData.supervisor || null
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
        }
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      toast.success('Floor updated successfully!')
      router.push(`/admin/floors/${id}`)
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update floor. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center h-64">
        <Loader className="animate-spin h-10 w-10 text-teal-600 mb-4" />
        <p className="text-gray-600">Loading floor details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2" size={20} />
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Layers className="text-teal-600 h-6 w-6" />
          Edit Floor
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Floor Number */}
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
               <Blinds className="mr-2 w-4 h-4" />  Floor Number *
              </label>
              <input
                id="number"
                name="number"
                type="number"
                value={formData.number}
                onChange={handleChange}
                className={`appearance-none w-full border border-gray-500 text-gray-900 placeholder-gray-700 font-medium rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-600 ${
                  errors.number ? 'border-red-500' : ''
                }`}
                placeholder="e.g., 0"
              />
              {errors.number && <p className="mt-1 text-sm text-red-600">{errors.number}</p>}
            </div>

            {/* Building */}
            <div>
              <label htmlFor="building" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Building className="mr-2 w-4 h-4" /> Building *
              </label>
              <div className="relative">
                {isBuildingLoading ? (
                  <div className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-500">
                    Loading buildings...
                    <Loader className="animate-spin ml-2" size={18} />
                  </div>
                ) : (
                  <>
                    <select
                      id="building"
                      name="building"
                      value={formData.building}
                      onChange={handleChange}
                      className={`appearance-none w-full border border-gray-500 text-gray-900 font-medium rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-teal-500 focus:border-teal-600 ${
                        errors.building ? 'border-red-500' : ''
                      }`}
                      required
                    >
                      <option value="">Select a building</option>
                      {buildings.map(building => (
                        <option key={building.id} value={building.id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <ChevronDown size={20} />
                    </div>
                  </>
                )}
              </div>
              {errors.building && <p className="mt-1 text-sm text-red-600">{errors.building}</p>}
            </div>

            {/* Supervisor (Optional) */}
            <div>
              <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <User2 className="mr-2 w-4 h-4" /> Supervisor (optional)
              </label>
              <select
                id="supervisor"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="appearance-none w-full border border-gray-500 text-gray-900 font-medium rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-teal-500 focus:border-teal-600"
              >
                <option value="">Select a supervisor</option>
                {supervisors.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
