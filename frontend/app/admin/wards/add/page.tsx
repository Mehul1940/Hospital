'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, Save, ArrowLeft, Bed, ChevronDown, Building, Layers } from 'lucide-react'
import { toast } from 'react-toastify'
import type { UUID, Building as BuildingType, Floor, Ward } from '@/app/utils/types'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

interface ExtendedFloor extends Floor {
  building_name: string
}

interface CreateWardBody {
  name: string
  floor: UUID
  building: UUID
}

export default function AddWardPage() {
  useAuthRedirect()
  const router = useRouter()
  const [form, setForm] = useState<Partial<Ward>>({ name: '', floor: '' as UUID })
  const [floors, setFloors] = useState<ExtendedFloor[]>([])
  const [buildings, setBuildings] = useState<BuildingType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedBuilding, setSelectedBuilding] = useState<UUID | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('access_token') || ''
      try {
        setIsLoading(true)

        // Fetch buildings
        const buildingsRes = await fetch(`${API_URL}/buildings/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!buildingsRes.ok) throw new Error('Failed to load buildings')
        const buildingsData: BuildingType[] = await buildingsRes.json()
        setBuildings(buildingsData)

        // Fetch floors
        const floorsRes = await fetch(`${API_URL}/floors/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!floorsRes.ok) throw new Error('Failed to load floors')
        const floorsData: Floor[] = await floorsRes.json()

        // Attach building name to each floor
        const extendedFloors = floorsData.map(floor => ({
          ...floor,
          building_name: buildingsData.find(b => b.id === floor.building)?.name || 'Unknown Building',
        }))

        setFloors(extendedFloors)

        if (extendedFloors.length > 0) {
          setForm(prev => ({ ...prev, floor: extendedFloors[0].id }))
          setSelectedBuilding(extendedFloors[0].building)
        }
      } catch (error) {
        console.error(error)
        toast.error('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Update selected building when floor changes
    if (name === 'floor') {
      const selectedFloor = floors.find(f => f.id === value)
      if (selectedFloor) {
        setSelectedBuilding(selectedFloor.building)
      }
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.name?.trim()) {
      newErrors.name = 'Ward name is required'
    }
    if (!form.floor) {
      newErrors.floor = 'Please select a floor'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    setIsSubmitting(true)
    const token = localStorage.getItem('access_token') || ''

    try {
      const wardData: CreateWardBody = {
        name: form.name!,
        floor: form.floor as UUID,
        building: selectedBuilding!,
      }

      const res = await fetch(`${API_URL}/wards/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(wardData),
      })

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json()
          const serverErrors = Object.entries(errorData).map(
            ([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`
          )
          toast.error(`Validation error: ${serverErrors.join('; ')}`)
          return
        }
        throw new Error(`HTTP error! Status: ${res.status}`)
      }

      toast.success('Ward created successfully!')
      router.push('/admin/wards')
    } catch (error) {
      console.error('Create error:', error)
      toast.error('Failed to create ward. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
          <Bed className="text-teal-600 h-6 w-6" />
          Add New Ward
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Layers className="mr-2 w-4 h-4" /> Ward Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name || ''}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., ICU Ward"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Building className="mr-2 w-4 h-4" /> Floor *
              </label>
              <div className="relative">
                {isLoading ? (
                  <div className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-500">
                    Loading floors...
                    <Loader className="animate-spin ml-2" size={18} />
                  </div>
                ) : (
                  <>
                    <select
                      id="floor"
                      name="floor"
                      value={form.floor || ''}
                      onChange={handleChange}
                      className={`appearance-none w-full border rounded-lg px-4 py-2.5 pr-10 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.floor ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select a floor</option>
                      {floors.map(f => (
                        <option key={f.id} value={f.id}>
                          Floor {f.number} - {f.building_name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <ChevronDown size={20} />
                    </div>
                  </>
                )}
              </div>
              {errors.floor && <p className="mt-1 text-sm text-red-600">{errors.floor}</p>}
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
                isSubmitting ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
              }`}
              disabled={isSubmitting || floors.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin mr-2" size={18} />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  Create Ward
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
