'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  Bed as BedIcon,
  ArrowLeft,
  User,
  Wrench,
  Check,
  X,
} from 'lucide-react'

interface BedFormData {
  number: string
  ward: string
  nurses: string[]
  status: 'available' | 'occupied' | 'maintenance'
}

interface Ward {
  id: string
  name: string
}

interface Nurse {
  id: string
  name: string
}

// Helper function to compare arrays regardless of order
const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  const setB = new Set(b)
  return a.every(item => setB.has(item)) && b.every(item => setA.has(item))
}

export default function EditBedPage() {
  const { id } = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState<BedFormData>({
    number: '',
    ward: '',
    nurses: [],
    status: 'available',
  })
  const initialFormData = useRef<BedFormData | null>(null)
  const [wards, setWards] = useState<Ward[]>([])
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [loadingNurses, setLoadingNurses] = useState(false)

  // Derived hasChanges state
  const hasChanges = useRef(false)
  if (initialFormData.current) {
    hasChanges.current = (
      formData.number !== initialFormData.current.number ||
      formData.ward !== initialFormData.current.ward ||
      formData.status !== initialFormData.current.status ||
      !arraysEqual(formData.nurses, initialFormData.current.nurses)
    )
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('access_token')
        if (!token) {
          toast.error('Authentication required')
          return router.push('/login')
        }

        // Fetch bed data
        const bedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!bedRes.ok) {
          if (bedRes.status === 404) {
            toast.error('Bed not found')
            return router.push('/admin/beds')
          }
          throw new Error(`Failed to fetch bed: ${bedRes.status}`)
        }

        const bedData = await bedRes.json()
        
        // Handle ward data (could be object or string)
        const wardId = bedData.ward?.id || bedData.ward
        
        // Handle nurses data (could be objects or IDs)
        const nurseIds = bedData.nurses?.length
          ? bedData.nurses.map((n: any) => n.id || n)
          : []

        const initialData = {
          number: bedData.number,
          ward: wardId,
          nurses: nurseIds,
          status: bedData.status || 'available',
        }
        
        setFormData(initialData)
        initialFormData.current = initialData

        // Fetch wards and nurses in parallel
        setLoadingWards(true)
        setLoadingNurses(true)
        
        const [wardsRes, nursesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/wards/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/nurses/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const wardsData = await wardsRes.json().catch(() => [])
        const nursesData = await nursesRes.json().catch(() => [])

        setWards(wardsData.results || wardsData || [])
        setNurses(nursesData.results || nursesData || [])
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error loading data')
      } finally {
        setIsLoading(false)
        setLoadingWards(false)
        setLoadingNurses(false)
      }
    }

    fetchData()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleNurse = (nurseId: string) => {
    setFormData(prev => {
      const newNurses = prev.nurses.includes(nurseId)
        ? prev.nurses.filter(id => id !== nurseId)
        : [...prev.nurses, nurseId]
      
      return { ...prev, nurses: newNurses }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Session expired. Please log in again.')
        return router.push('/login')
      }

      if (!formData.number.trim()) return toast.error('Bed number is required')
      if (!formData.ward) return toast.error('Please select a ward')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json()
          if (errorData.number) return toast.error(`Bed number error: ${errorData.number.join(' ')}`)
          if (errorData.ward) return toast.error(`Ward error: ${errorData.ward.join(' ')}`)
          return toast.error(errorData.message || 'Validation error')
        }
        if (res.status === 403) return toast.error('You do not have permission to update beds')
        throw new Error(`Update failed: ${res.status}`)
      }

      toast.success('Bed updated successfully')
      router.push('/admin/beds')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error updating bed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'occupied':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <BedIcon className="text-green-500 h-5 w-5" />
      case 'occupied':
        return <User className="text-blue-500 h-5 w-5" />
      case 'maintenance':
        return <Wrench className="text-yellow-500 h-5 w-5" />
      default:
        return <BedIcon className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="mt-4 text-lg text-gray-600">Loading bed information...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/admin/beds')}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Beds
        </button>
        <h1 className="text-2xl font-bold ml-4">Edit Bed</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
              Bed Number *
            </label>
            <div className="relative">
              <input
                id="number"
                name="number"
                type="text"
                value={formData.number}
                onChange={handleChange}
                className="w-full px-4 py-3 pl-11 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70"
                placeholder="Enter bed number"
                required
                disabled={isSubmitting}
              />
              <BedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 pl-11 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70 appearance-none"
                required
                disabled={isSubmitting}
              >
                <option value="available">Available</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="occupied">Occupied</option>
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                {getStatusIcon(formData.status)}
              </div>
              <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs rounded-full ${getStatusColor(formData.status)}`}>
                {formData.status}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
            Ward *
          </label>
          <select
            id="ward"
            name="ward"
            value={formData.ward}
            onChange={handleChange}
            className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70"
            required
            disabled={isSubmitting || loadingWards}
          >
            <option value="">Select a ward</option>
            {wards.map(ward => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
            {loadingWards && <option disabled>Loading wards...</option>}
            {!loadingWards && wards.length === 0 && (
              <option disabled>No wards available</option>
            )}
          </select>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">Assigned Nurses</h3>
            <span className="text-xs text-gray-500">{formData.nurses.length} assigned</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {nurses.length > 0 ? (
                  nurses.map(nurse => (
                    <div 
                      key={nurse.id}
                      onClick={() => toggleNurse(nurse.id)}
                      className={`p-2 mb-1 rounded-md cursor-pointer transition-colors ${
                        formData.nurses.includes(nurse.id)
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {nurse.name}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-center text-gray-500">
                    {loadingNurses ? 'Loading nurses...' : 'No nurses available'}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Click to assign/unassign nurses
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Nurses:</h4>
              {formData.nurses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.nurses.map(nurseId => {
                    const nurse = nurses.find(n => n.id === nurseId)
                    return (
                      <span
                        key={nurseId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {nurse ? nurse.name : `Nurse (${nurseId.substring(0, 6)}...)`}
                        <button
                          type="button"
                          onClick={() => toggleNurse(nurseId)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X size={16} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No nurses assigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          {hasChanges.current && !isSubmitting && (
            <div className="flex items-center text-green-600">
              <Check className="mr-2 h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => router.push('/admin/beds')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-70"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 flex items-center"
              disabled={isSubmitting || !hasChanges.current}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : 'Update Bed'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}