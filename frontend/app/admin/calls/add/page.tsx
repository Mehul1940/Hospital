'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PlusCircle, ArrowLeft, Loader2, Clock, Bed, Smartphone,
  User, Clipboard, AlertCircle
} from 'lucide-react'
import {
  CallStatus, Bed as BedType, Device, Nurse, Ward
} from '@/app/utils/types'
import toast from 'react-hot-toast'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function AddCallPage() {
  useAuthRedirect()
  const router = useRouter()
  const [formData, setFormData] = useState({
    device: '',
    bed: '',
    call_time: '',
    status: 'pending' as CallStatus,
    nurse: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [devices, setDevices] = useState<Device[]>([])
  const [beds, setBeds] = useState<BedType[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''

  const wardMap = useMemo(() => {
    return new Map(wards.map(ward => [ward.id, ward]))
  }, [wards])

  const fetchOptions = useCallback(async () => {
    try {
      if (!token) return
      const headers = { Authorization: `Bearer ${token}` }

      const [devicesRes, bedsRes, wardsRes, nursesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/devices/`, { headers }),
        fetch(`${API_BASE_URL}/beds/`, { headers }),
        fetch(`${API_BASE_URL}/wards/`, { headers }),
        fetch(`${API_BASE_URL}/nurses/`, { headers })
      ])

      if (!devicesRes.ok) throw new Error('Failed to load devices')
      if (!bedsRes.ok) throw new Error('Failed to load beds')
      if (!wardsRes.ok) throw new Error('Failed to load wards') 
      if (!nursesRes.ok) throw new Error('Failed to load nurses')

      const [devicesData, bedsData, wardsData, nursesData] = await Promise.all([
        devicesRes.json(),
        bedsRes.json(),
        wardsRes.json(),
        nursesRes.json(),
      ])

      setDevices(devicesData)
      setBeds(bedsData)
      setWards(wardsData)
      setNurses(nursesData)
      setHasFetched(true)

      const now = new Date()
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setFormData(prev => ({ ...prev, call_time: localDateTime }))
    } catch (error: any) {
      console.error('Fetch error:', error)
      toast.error(error.message || 'Failed to load required data')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }
    if (!hasFetched) {
      fetchOptions()
    }
  }, [router, token, fetchOptions, hasFetched])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!formData.device) errors.device = 'Device is required'
    if (!formData.bed) errors.bed = 'Bed is required'

    if (!formData.call_time) {
      errors.call_time = 'Call time is required'
    } else {
      const callTime = new Date(formData.call_time)
      const now = new Date()

      if (callTime > now) errors.call_time = 'Call time cannot be in the future'

      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      if (callTime < oneYearAgo) errors.call_time = 'Call time is too far in the past'
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/calls/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          call_time: new Date(formData.call_time).toISOString(),
          nurse: formData.nurse || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || data.message || 'Failed to create call')
      }

      toast.success('Call created successfully!')
      router.push('/admin/calls')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error creating call')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin size-12 text-teal-600 mb-4" />
        <p className="text-gray-600">Loading call information...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to calls</span>
        </button>

        <div className="flex items-center gap-3 mb-2">
          <PlusCircle className="text-teal-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">Add New Call</h1>
        </div>
        <p className="text-gray-600">Log a new patient call with all relevant details</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Device */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Smartphone size={16} /> Device *
            </label>
            <select
              name="device"
              value={formData.device}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full border text-gray-900 ${fieldErrors.device ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
            >
              <option value="">Select a device</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.serial_number}</option>
              ))}
            </select>
            {fieldErrors.device && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} /> {fieldErrors.device}
              </p>
            )}
          </div>

          {/* Bed */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Bed size={16} /> Bed *
            </label>
            <select
              name="bed"
              value={formData.bed}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full border text-gray-900 ${fieldErrors.bed ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
            >
              <option value="">Select a bed</option>
              {beds.map(bed => {
                const ward = wardMap.get(bed.ward)
                return (
                  <option key={bed.id} value={bed.id}>
                    {bed.number} • {ward ? ward.name : 'Unknown Ward'}
                  </option>
                )
              })}
            </select>
            {fieldErrors.bed && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} /> {fieldErrors.bed}
              </p>
            )}
          </div>

          {/* Call Time */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Clock size={16} /> Call Time *
            </label>
            <input
              type="datetime-local"
              name="call_time"
              value={formData.call_time}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full border text-gray-900 ${fieldErrors.call_time ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
            />
            {fieldErrors.call_time && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} /> {fieldErrors.call_time}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border text-gray-900 border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="cancelled">Cancelled</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Nurse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <User size={16} /> Nurse (Optional)
            </label>
            <select
              name="nurse"
              value={formData.nurse}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border text-gray-900 border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a nurse</option>
              {nurses.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        </div>


        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-5 rounded-lg transition disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin size-5" /> : <PlusCircle className="size-5" />}
            {isSubmitting ? 'Creating Call...' : 'Create Call'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/calls')}
            disabled={isSubmitting}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-5 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
