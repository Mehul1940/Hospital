'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { BASE_URL, getAuthHeaders } from '@/app/utils/api'
import { toast } from 'react-hot-toast'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface Resource {
  id: string
  number?: string
  name?: string
  serial_number?: string
}

interface FormData {
  name: string
  age: string
  gender: string
  bed: string
  nurse: string
  device: string
}

interface FormErrors {
  name?: string
  age?: string
}

export default function AddPatientPage() {
  useAuthRedirect()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    gender: 'Male',
    bed: '',
    nurse: '',
    device: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [resources, setResources] = useState({
    beds: [] as Resource[],
    nurses: [] as Resource[],
    devices: [] as Resource[],
  })
  const [status, setStatus] = useState({
    loading: true,
    submitting: false,
    error: '',
  })

  useEffect(() => {
    const abortController = new AbortController()
    const fetchResources = async () => {
      try {
        setStatus(prev => ({ ...prev, loading: true }))
        const headers = getAuthHeaders()
        const [bedsRes, nursesRes, devicesRes] = await Promise.all([
          fetch(`${BASE_URL}/beds/`, { headers, signal: abortController.signal }),
          fetch(`${BASE_URL}/nurses/`, { headers, signal: abortController.signal }),
          fetch(`${BASE_URL}/devices/`, { headers, signal: abortController.signal }),
        ])
        if (!bedsRes.ok || !nursesRes.ok || !devicesRes.ok) throw new Error('Failed to fetch resources')
        setResources({
          beds: await bedsRes.json(),
          nurses: await nursesRes.json(),
          devices: await devicesRes.json(),
        })
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setStatus(prev => ({ ...prev, error: err.message || 'Failed to load resources' }))
        console.error('Fetch error:', err)
      } finally {
        setStatus(prev => ({ ...prev, loading: false }))
      }
    }
    fetchResources()
    return () => abortController.abort()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.age) {
      newErrors.age = 'Age is required'
    } else {
      const age = parseInt(formData.age)
      if (isNaN(age)) newErrors.age = 'Age must be a number'
      else if (age < 1 || age > 120) newErrors.age = 'Age must be between 1–120'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setStatus(prev => ({ ...prev, submitting: true }))
    try {
      const payload = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        bed: formData.bed || null,
        nurse: formData.nurse || null,
        device: formData.device || null,
      }
      const res = await fetch(`${BASE_URL}/patients/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json())?.message || 'Failed to create patient')
      toast.success('Patient created successfully!', {
        icon: <CheckCircle className="text-green-500" />,
        position: 'top-center',
      })
      router.push('/admin/patients')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create patient. Please try again.')
      console.error('Submit error:', err)
    } finally {
      setStatus(prev => ({ ...prev, submitting: false }))
    }
  }

  const handleCancel = useCallback(() => {
    if (formData.name || formData.age || !status.submitting) {
      router.push('/admin/patients')
    }
  }, [formData, status.submitting, router])

  if (status.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Loader2 className="animate-spin text-teal-600 size-12 mb-4" />
        <p className="text-gray-600">Loading resources...</p>
      </div>
    )
  }

  if (status.error) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Resources</h2>
          <p className="text-red-600 mb-4">{status.error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleCancel}
              className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Patients
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          disabled={status.submitting}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-lg">
            <CheckCircle className="text-teal-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Add New Patient</h1>
            <p className="text-gray-600">Fill in the details below to create a new patient record</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border p-5 sm:p-7 shadow-sm">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-3 border text-gray-800 bg-gray-100 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 ${
              errors.name ? 'border-red-300 focus:ring-red-500' : ''
            }`}
            placeholder="John Doe"
            disabled={status.submitting}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Age and Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              className={`w-full p-3 border text-gray-800 bg-gray-100 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500 ${
                errors.age ? 'border-red-300 focus:ring-red-500' : ''
              }`}
              placeholder="30"
              min={1}
              max={120}
              disabled={status.submitting}
            />
            {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-3 border text-gray-800 bg-gray-100 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500"
              disabled={status.submitting}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Bed, Nurse, Device */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {['bed', 'nurse', 'device'].map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
              <select
                name={key}
                value={(formData as any)[key]}
                onChange={handleChange}
                className="w-full p-3 border text-gray-800 bg-gray-100 focus:bg-white rounded-lg focus:ring-2 focus:ring-teal-500"
                disabled={status.submitting}
              >
                <option value="">Select a {key}</option>
                {(resources as any)[key + 's'].map((item: Resource) => (
                  <option key={item.id} value={item.id}>
                    {item.name || item.number || item.serial_number}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Submit & Cancel */}
        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={status.submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={status.submitting}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center disabled:opacity-70 min-w-[130px]"
          >
            {status.submitting ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Creating...
              </>
            ) : (
              'Create Patient'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
