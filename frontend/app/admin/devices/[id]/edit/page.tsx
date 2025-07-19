'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { ArrowLeft, Loader, Save } from 'lucide-react'

export default function EditDevicePage() {
  const { id } = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState({
    serialNumber: '',
    bed: ''
  })
  const [beds, setBeds] = useState<{ id: string; number: string; room?: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.push('/login')
          return
        }

        const [deviceRes, bedsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (!deviceRes.ok) throw new Error('Failed to fetch device')
        if (!bedsRes.ok) throw new Error('Failed to fetch beds')

        const device = await deviceRes.json()
        const bedData = await bedsRes.json()
        const bedList = bedData.results || bedData || []

        setFormData({
          serialNumber: device.serial_number,
          bed: device.bed?.id || ''
        })
        setBeds(bedList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        toast.error('Failed to load device data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          serial_number: formData.serialNumber,
          bed: formData.bed
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to update device')
      }

      toast.success('Device updated successfully!')
      router.push('/admin/devices')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Device update failed'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center mt-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold">Error Loading Device</h2>
          <p className="mt-2">{error}</p>
        </div>
        <button 
          onClick={() => router.push('/admin/devices')}
          className="flex items-center justify-center gap-2 text-teal-700 hover:text-teal-900 font-medium"
        >
          <ArrowLeft /> Back to Devices
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-sm mt-6">
      <div className="mb-6">
        <button 
          onClick={() => router.push('/admin/devices')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium mb-4"
        >
          <ArrowLeft /> Back to Devices
        </button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Edit Device</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input
              id="serialNumber"
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-800"
              value={formData.serialNumber}
              onChange={handleChange}
              required
              placeholder="Enter device serial number"
            />
          </div>

          <div>
            <label htmlFor="bed" className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Bed <span className="text-red-500">*</span>
            </label>
            <select
              id="bed"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSI2IDkgMTIgMTUgMTggOSI+PC9wb2x5bGluZT48L3N2Zz4=')] bg-no-repeat bg-[center_right_1rem]"
              value={formData.bed}
              onChange={handleChange}
              required
            >
              <option value="">Select a bed</option>
              {beds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  Bed {bed.number} {bed.room && `(Room: ${bed.room})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/admin/devices')}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition min-w-[140px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin" /> Updating...
              </>
            ) : (
              <>
                <Save /> Update Device
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
