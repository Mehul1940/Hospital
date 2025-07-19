'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Hospital,
  ArrowLeft,
  PlusCircle,
  MapPin,
  Phone,
  Activity,
} from 'lucide-react'
import { jwtDecode } from 'jwt-decode'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"

// Utility: decode token and check expiry
function isTokenExpired(token: string) {
  try {
    const decoded: any = jwtDecode(token)
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return null

  try {
    const res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) return null
    const data = await res.json()
    localStorage.setItem('access_token', data.access)
    return data.access
  } catch {
    return null
  }
}

export default function AddHospitalPage() {
  useAuthRedirect()
  const router = useRouter()
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone_number: '',
    speciality: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      const { [name]: _, ...rest } = errors
      setErrors(rest)
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

    setIsSubmitting(true)

    try {
      let token = localStorage.getItem('access_token')
      if (!token || isTokenExpired(token)) {
        token = await refreshAccessToken()
      }

      if (!token) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        router.push('/login')
        return
      }

      console.log('Submitting form data:', formData) // ✅ Debugging

      const res = await fetch(`${API_BASE_URL}/hospitals/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to add hospital')
      }

      router.push('/admin/hospitals')
    } catch (err: any) {
      if (isMounted.current) setErrors({ submit: err.message })
    } finally {
      if (isMounted.current) setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-teal-600 hover:text-teal-800 mb-6 transition"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Hospitals
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-teal-50 p-3 rounded-lg">
            <Hospital className="h-8 w-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Hospital</h1>
            <p className="text-gray-500 mt-1">
              Fill in the details below to register a new healthcare facility
            </p>
          </div>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Activity className="inline h-4 w-4 text-teal-600 mr-1" />
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="St. Mary's Medical Center"
                className={`w-full px-4 py-3 rounded-lg border text-gray-900 focus:outline-none focus:ring-2 transition ${
                  errors.name ? 'border-red-300 ring-red-200' : 'border-gray-300 ring-teal-200'
                }`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialty
              </label>
              <input
                name="speciality"
                value={formData.speciality}
                onChange={handleChange}
                placeholder="Cardiology, Pediatrics"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-200 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline h-4 w-4 text-teal-600 mr-1" />
              Address <span className="text-red-500">*</span>
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Medical Blvd, City, State"
              className={`w-full px-4 py-3 rounded-lg border text-gray-900 focus:outline-none focus:ring-2 transition ${
                errors.address ? 'border-red-300 ring-red-200' : 'border-gray-300 ring-teal-200'
              }`}
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline h-4 w-4 text-teal-600 mr-1" />
              Phone Number
            </label>
            <input
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-200 transition"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/hospitals')}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2-647z" />
                </svg>
              ) : (
                <PlusCircle className="h-5 w-5 mr-2" />
              )}
              {isSubmitting ? 'Saving...' : 'Add Hospital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
