'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { PlusCircle, ArrowLeft, Loader2, Bed } from 'lucide-react'
import Link from 'next/link'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

export default function AddDevicePage() {
  useAuthRedirect()
  const [formData, setFormData] = useState({
    serialNumber: '',
    bed: ''
  })
  const [beds, setBeds] = useState<{ id: string; number: string; ward: { name: string } | null }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingBeds, setLoadingBeds] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchBeds = async () => {
      try {
        setLoadingBeds(true)
        const token = localStorage.getItem('access_token')
        if (!token) {
          toast.error('Authentication required')
          return router.push('/login')
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/?available=true`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.status === 401) {
          toast.error('Session expired. Please log in again.')
          return router.push('/login')
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch beds: ${res.status}`)
        }

        const data = await res.json()
        setBeds(data.results || data)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error loading beds')
      } finally {
        setLoadingBeds(false)
      }
    }

    fetchBeds()
  }, [router])

  const validateField = (name: string, value: string) => {
    let error = ''
    
    if (name === 'serialNumber') {
      if (!value.trim()) error = 'Serial number is required'
      else if (value.length < 4) error = 'Must be at least 4 characters'
    }
    
    if (name === 'bed' && !value) error = 'Please select a bed'
    
    setErrors(prev => ({ ...prev, [name]: error }))
    return !error
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing/selecting
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const isValid = Object.entries(formData).every(([name, value]) => 
      validateField(name, value)
    )
    
    if (!isValid) return

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Session expired. Please log in again.')
        return router.push('/login')
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serial_number: formData.serialNumber,
          bed: formData.bed
        }),
      })

      if (res.status === 401) {
        toast.error('Session expired. Please log in again.')
        return router.push('/login')
      }

      if (!res.ok) {
        const errorData = await res.json()
        const serverError = errorData.serial_number?.[0] || 
                           errorData.bed?.[0] || 
                           errorData.detail ||
                           'Error adding device'
        throw new Error(serverError)
      }

      toast.success('Device added successfully!')
      router.push('/admin/devices')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error adding device')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6 md:mb-8">
        <button
          onClick={() => router.push('/admin/devices')}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors group"
          aria-label="Back to devices"
        >
          <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
          Back to Devices
        </button>
        <h1 className="text-xl md:text-2xl font-bold ml-4 text-gray-800">Add New Device</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="h-12 bg-gradient-to-r from-teal-500 to-teal-600"></div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="space-y-5">
            {/* Serial Number Field */}
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number <span className="text-red-500">*</span>
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                className={`w-full px-4 py-2.5 border ${
                  errors.serialNumber ? 'border-red-500' : 'border-gray-300'
                } text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all`}
                value={formData.serialNumber}
                onChange={handleChange}
                onBlur={(e) => validateField('serialNumber', e.target.value)}
                placeholder="Enter device serial number"
                disabled={isSubmitting}
                aria-invalid={!!errors.serialNumber}
                aria-describedby={errors.serialNumber ? "serial-error" : undefined}
              />
              {errors.serialNumber && (
                <p id="serial-error" className="mt-1 text-sm text-red-600">
                  {errors.serialNumber}
                </p>
              )}
            </div>

            {/* Bed Selection Field */}
            <div>
              <label htmlFor="bed" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Bed <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="bed"
                  name="bed"
                  className={`w-full px-4 py-2.5 appearance-none border ${
                    errors.bed ? 'border-red-500' : 'border-gray-300'
                  } text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-70`}
                  value={formData.bed}
                  onChange={handleChange}
                  disabled={isSubmitting || loadingBeds}
                  aria-invalid={!!errors.bed}
                  aria-describedby={errors.bed ? "bed-error" : undefined}
                >
                  <option value="">Select a bed</option>
                  {beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.number} {b.ward?.name ? `(${b.ward.name})` : ''}
                    </option>
                  ))}
                </select>

                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {loadingBeds ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : (
                    <Bed className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {errors.bed && (
                <p id="bed-error" className="mt-1 text-sm text-red-600">
                  {errors.bed}
                </p>
              )}

              {!loadingBeds && beds.length === 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-sm text-yellow-800">
                    No available beds found. <Link
                      href="/admin/beds/add"
                      className="text-teal-600 hover:text-teal-800 font-medium transition-colors"
                    >
                      Create a new bed
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/devices')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center"
              disabled={isSubmitting || loadingBeds || beds.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Device...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Device
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h3 className="font-medium text-blue-800 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Device Information</span>
        </h3>
        <p className="mt-2 text-sm text-blue-700">
          Devices are monitoring units assigned to specific beds. Each device must have a unique serial number.
          Only beds not currently assigned to a device are shown in the selection list.
        </p>
      </div>
    </div>
  )
}