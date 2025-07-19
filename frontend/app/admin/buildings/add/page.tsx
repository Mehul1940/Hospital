// File: app/admin/buildings/add/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Building2 as BuildingIcon,
  ChevronLeft,
  Save,
  Loader,
  PlusCircle,
  AlertCircle,
} from 'lucide-react'
import { BUILDING_TYPE_CHOICES, BuildingType, Hospitals, User } from '@/app/utils/types'
import { fetchHospitals, fetchUsers } from '@/app/utils/api'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_BASE = process.env.NEXT_PUBLIC_API_URL!

export default function AddBuildingPage() {
  useAuthRedirect()
  const router = useRouter()

  const [formData, setFormData] = useState<{
    name: string
    hospital: string
    supervisor: string
    building_type: BuildingType
    floors: number | ''
    address: string
    description: string
  }>({
    name: '',
    hospital: '',
    supervisor: '',
    building_type: 'other',
    floors: '',
    address: '',
    description: '',
  })

  const [hospitals, setHospitals]     = useState<Hospitals[]>([])
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [fetchError, setFetchError]   = useState<string|null>(null)

  useEffect(() => {
    async function load() {
      try {
        setFetchError(null)
        const [hData, uData] = await Promise.all([
          fetchHospitals(),
          fetchUsers(),
        ])
        setHospitals(hData)
        setSupervisors(uData.filter(u => u.role === 'supervisor'))
        if (hData.length) {
          setFormData(fd => ({ ...fd, hospital: hData[0].id }))
        }
      } catch (err: any) {
        console.error(err)
        setFetchError('Failed to load required data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(fd => ({
      ...fd,
      [name]: name === 'floors' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access_token')!
      const payload = {
        ...formData,
        supervisor: formData.supervisor || null,
        floors: formData.floors === '' ? null : formData.floors,
      }
      const res = await fetch(`${API_BASE}/buildings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to save building')
      }
      
      toast.success('Building added successfully!', {
        icon: <BuildingIcon className="text-teal-500" />,
        position: 'bottom-right'
      })
      router.push('/admin/buildings')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to save building. Please try again.', {
        position: 'bottom-right'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="h-10 bg-gray-200 rounded w-64"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 pt-4">
            <div className="flex-1 h-12 bg-gray-200 rounded"></div>
            <div className="flex-1 h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium mb-4"
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Buildings
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <BuildingIcon className="text-teal-600 h-8 w-8" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Add New Building</h1>
            <p className="text-gray-600 mt-1">
              Fill in the details below to create a new building
            </p>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Building Name *
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-400 text-gray-800 placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="e.g., Main Hospital Building"
            />
          </div>

          {/* Hospital Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital *
            </label>
            {hospitals.length === 0 ? (
              <div className="border border-gray-300 rounded-lg px-4 py-3 bg-yellow-50">
                <p className="text-yellow-700 mb-2">
                  No hospitals available. Please add a hospital first.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/admin/hospitals/add')}
                    
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add Hospital
                </button>
              </div>
            ) : (
              <select
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                required
                className="w-full border border-gray-400 text-gray-800 placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Supervisor Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supervisor
            </label>
            {supervisors.length === 0 ? (
              <div className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                <p className="text-gray-500">
                  No supervisors available
                </p>
              </div>
            ) : (
              <select
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="w-full border border-gray-400 text-gray-800 placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              >
                <option value="">Select a supervisor</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.username}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Building Type */}
          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building Type
                </label>
                <select
                    name="building_type"
                    value={formData.building_type}
                    onChange={handleChange}
                    className="w-full border border-gray-400 text-gray-800 placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                >
                    {BUILDING_TYPE_CHOICES.map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                    ))}
                </select>
            </div>

          {/* Floors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Floors
            </label>
            <input
              type="number"
              name="floors"
              min={0}
              value={formData.floors}
              onChange={handleChange}
              className="w-full border border-gray-400 text-gray-800 placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="Enter number of floors"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
             className="w-full border border-gray-400 text-gray-800 placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="Full building address"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-400 text-gray-800 placeholder-gray-500 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="Describe the building's purpose, features, etc."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 pt-6">
          <button
            type="submit"
            disabled={submitting || hospitals.length === 0}
            className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
              submitting || hospitals.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all'
            }`}
          >
            {submitting ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" /> Saving...
              </>
            ) : hospitals.length === 0 ? (
              "Add Hospital First"
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" /> Save Building
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/admin/buildings')}
            className="flex-1 py-3 px-6 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}