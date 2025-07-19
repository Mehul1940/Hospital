'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Hospital, ArrowLeft, Save, Loader } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'

type HospitalData = {
  name: string
  address: string
  phone_number: string
  speciality: string
}

export default function EditHospitalPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''

  const [formData, setFormData] = useState<HospitalData>({
    name: '',
    address: '',
    phone_number: '',
    speciality: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch hospital by ID
  useEffect(() => {
    const fetchHospital = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        console.warn('Access token not found')
        router.push('/login')
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/hospitals/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.detail || 'Failed to fetch hospital data')
        }

        const data = await response.json()
        setFormData({
          name: data.name || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
          speciality: data.speciality || '',
        })
      } catch (error: any) {
        console.error('Error fetching hospital:', error.message)
        setErrors({ fetch: error.message || 'Failed to load hospital data' })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchHospital()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Hospital name is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const token = localStorage.getItem('access_token')
    if (!token) {
      setErrors({ submit: 'Authentication token not found.' })
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to update hospital')
      }

      router.push(`/admin/hospitals/${id}`)
    } catch (error: any) {
      console.error('Failed to update hospital:', error.message)
      setErrors({ submit: error.message || 'Failed to update hospital. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
        <Loader className="h-12 w-12 text-teal-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center text-teal-600 hover:text-teal-800 mb-6 transition-colors group"
      >
        <ArrowLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Hospital
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
          <div className="bg-amber-50 p-3 rounded-lg">
            <Hospital className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Hospital</h1>
            <p className="text-gray-500 mt-1">Update the details of this healthcare facility</p>
          </div>
        </div>

        {errors.fetch && (
          <p className="mb-6 text-sm text-red-600">{errors.fetch}</p>
        )}
        {errors.submit && (
          <p className="mb-6 text-sm text-red-600">{errors.submit}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hospital Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full mt-1 px-4 py-3 rounded-lg border ${errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-teal-500"} text-gray-800 focus:outline-none focus:ring-2`}
                placeholder="St. Mary's Medical Center"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Speciality</label>
              <input
                type="text"
                name="speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Cardiology, Pediatrics..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full mt-1 px-4 py-3 rounded-lg border ${errors.address ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-teal-500"} text-gray-800 focus:outline-none focus:ring-2`}
              placeholder="123 Medical Blvd, City, State"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Update Hospital
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
