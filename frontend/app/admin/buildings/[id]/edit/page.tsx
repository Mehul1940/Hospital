'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { 
  ChevronLeft, 
  Building2, 
  Save, 
  Loader, 
  AlertCircle,
  MapPin,
  Layers,
  User as UserIcon,
  Hospital as HospitalIcon
} from 'lucide-react'
import { BUILDING_TYPE_CHOICES, BuildingType, Hospitals, User } from '@/app/utils/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export default function EditBuildingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    hospital: '',
    supervisor: '',
    building_type: 'other' as BuildingType,
    floors: '' as number | '',
    address: '',
    description: ''
  })
  
  const [hospitals, setHospitals] = useState<Hospitals[]>([])
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token') || ''

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [buildingRes, hospitalsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/buildings/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/hospitals/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/users/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
        ])

        if (!buildingRes.ok) throw new Error('Failed to load building data')
        if (!hospitalsRes.ok) throw new Error('Failed to load hospitals')
        if (!usersRes.ok) throw new Error('Failed to load users')

        const building = await buildingRes.json()
        const hospitalList = await hospitalsRes.json()
        const userList = await usersRes.json()

        setFormData({
          name: building.name,
          hospital: building.hospital,
          supervisor: building.supervisor || '',
          building_type: building.building_type,
          floors: building.floors ?? '',
          address: building.address || '',
          description: building.description || ''
        })

        setHospitals(hospitalList)
        setSupervisors(userList.filter((u: User) => u.role === 'supervisor'))
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load data')
        toast.error('Failed to load building details')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'floors' ? (value === '' ? '' : Number(value)) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('access_token') || ''
    setSubmitting(true)
    
    try {
      const res = await fetch(`${API_BASE_URL}/buildings/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          supervisor: formData.supervisor || null,
          floors: formData.floors === '' ? null : formData.floors
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Update failed')
      }
      
      toast.success('Building updated successfully!')
      router.push('/admin/buildings')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to update building')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="h-8 bg-gray-200 rounded w-64"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          
          <div className="h-12 bg-gray-200 rounded w-full mt-6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => router.push(`/admin/buildings/${id}`)}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium mb-4"
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Building
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="text-teal-600 h-8 w-8" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Edit Building</h1>
        </div>
        <p className="text-gray-600">
          Update the details of this building
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Building Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                placeholder="e.g., Main Hospital Building"
              />
            </div>

            {/* Hospital Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <HospitalIcon className="h-4 w-4 mr-2 text-gray-500" /> Hospital *
              </label>
              <select
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
              >
                <option value="">Select a hospital</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supervisor Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-gray-500" /> Supervisor
              </label>
              <select
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
              >
                <option value="">Select supervisor</option>
                {supervisors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.username}
                  </option>
                ))}
              </select>
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
                 className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
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
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Layers className="h-4 w-4 mr-2 text-gray-500" /> Number of Floors
              </label>
              <input
                type="number"
                name="floors"
                min={0}
                value={formData.floors}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                placeholder="Enter number of floors"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" /> Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
                placeholder="Describe the building's purpose, features, etc."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center ${
                submitting
                  ? 'bg-teal-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all'
              }`}
            >
              {submitting ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" /> Update Building
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.push(`/admin/buildings/${id}`)}
              className="flex-1 py-3 px-6 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}