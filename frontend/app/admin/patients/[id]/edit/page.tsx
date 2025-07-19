'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BASE_URL, getAuthHeaders } from '@/app/utils/api'
import { Patient, Bed, Nurse, Device } from '@/app/utils/types'

type PatientFormData = {
  id: string
  name: string
  age: number
  gender: string
  bed: string | null
  nurse: string | null
  device: string | null
}

export default function EditPatientPage() {
  const { id } = useParams()
  const router = useRouter()
  const [formData, setFormData] = useState<PatientFormData>({
    id: '',
    name: '',
    age: 0,
    gender: '',
    bed: null,
    nurse: null,
    device: null
  })
  const [beds, setBeds] = useState<Bed[]>([])
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [patientRes, bedsRes, nursesRes, devicesRes] = await Promise.all([
          fetch(`${BASE_URL}/patients/${id}/`, { headers: getAuthHeaders() }),
          fetch(`${BASE_URL}/beds/`, { headers: getAuthHeaders() }),
          fetch(`${BASE_URL}/nurses/`, { headers: getAuthHeaders() }),
          fetch(`${BASE_URL}/devices/`, { headers: getAuthHeaders() })
        ])

        if (!patientRes.ok) throw new Error('Failed to load patient')
        if (!bedsRes.ok) throw new Error('Failed to load beds')
        if (!nursesRes.ok) throw new Error('Failed to load nurses')
        if (!devicesRes.ok) throw new Error('Failed to load devices')

        const patientData: Patient = await patientRes.json()

        setFormData({
          id: patientData.id,
          name: patientData.name,
          age: patientData.age,
          gender: patientData.gender,
          bed: patientData.bed ? String(patientData.bed) : null,
          nurse: patientData.nurse ? String(patientData.nurse) : null,
          device: patientData.device ? String(patientData.device) : null
        })

        setBeds(await bedsRes.json())
        setNurses(await nursesRes.json())
        setDevices(await devicesRes.json())
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      const response = await fetch(`${BASE_URL}/patients/${id}/`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          bed: formData.bed || null,
          nurse: formData.nurse || null,
          device: formData.device || null
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update patient (${response.status})`)
      }

      router.push('/admin/patients')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 rounded-lg p-6">
          <div className="text-red-700 font-bold mb-2">Error</div>
          <p className="mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition flex-1"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition flex-1"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Edit Patient</h1>
          <p className="mt-2 text-lg text-gray-600">Update patient information</p>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="0"
                    max="120"
                    required
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="bed" className="block text-sm font-medium text-gray-700 mb-1">
                    Bed Assignment
                  </label>
                  <select
                    id="bed"
                    name="bed"
                    value={formData.bed || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  >
                    <option value="">Select Bed</option>
                    {beds.map((bed) => (
                      <option key={bed.id} value={bed.id}>
                        Bed {bed.number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="nurse" className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Nurse
                  </label>
                  <select
                    id="nurse"
                    name="nurse"
                    value={formData.nurse || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  >
                    <option value="">Select Nurse</option>
                    {nurses.map((nurse) => (
                      <option key={nurse.id} value={nurse.id}>
                        {nurse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="device" className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Device
                  </label>
                  <select
                    id="device"
                    name="device"
                    value={formData.device || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  >
                    <option value="">Select Device</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.serial_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/patients')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                      Updating...
                    </span>
                  ) : (
                    'Update Patient'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
