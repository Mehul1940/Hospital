// File: app/admin/wards/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Loader2,
  Save,
  Building2,
  Layers,
  Bed,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'
import { toast } from 'react-toastify'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

interface Building {
  id: string
  name: string
  building_type: string
}

interface Ward {
  id: string
  name: string
  building: string
  floor: string
  description?: string
}

export default function EditWardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    building: '',
    floor: '',
    description: ''
  })
  const [buildings, setBuildings] = useState<Building[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('access_token') || ''
      try {
        setLoading(true)
        setError(false)

        // Fetch buildings and ward
        const [buildingsRes, wardRes] = await Promise.all([
          fetch(`${API_URL}/buildings/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/wards/${id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        if (!buildingsRes.ok || !wardRes.ok) throw new Error()
        const buildingsData: Building[] = await buildingsRes.json()
        const wardData: Ward = await wardRes.json()

        setBuildings(buildingsData)
        setForm({
          name: wardData.name,
          building: wardData.building,
          floor: wardData.floor,
          description: wardData.description || ''
        })

        // Fetch floors for the selected building
        if (wardData.building) {
          const floorsRes = await fetch(
            `${API_URL}/floors/?building=${wardData.building}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (!floorsRes.ok) throw new Error()
          setFloors(await floorsRes.json())
        }
      } catch {
        toast.error('Failed to load data')
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleBuildingChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buildingId = e.target.value
    setForm(prev => ({ ...prev, building: buildingId, floor: '' }))
    if (buildingId) {
      try {
        const token = localStorage.getItem('access_token') || ''
        const res = await fetch(`${API_URL}/floors/?building=${buildingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error()
        setFloors(await res.json())
      } catch {
        toast.error('Failed to load floors')
      }
    } else {
      setFloors([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const token = localStorage.getItem('access_token') || ''
    try {
      const res = await fetch(`${API_URL}/wards/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          building: form.building,
          floor: form.floor,
          description: form.description || null
        })
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Ward updated successfully')
      router.push(`/admin/wards/`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to update ward')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-600 h-12 w-12" />
        <p className="mt-4 text-gray-900">Loading ward details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg mb-6">
          <AlertCircle className="inline-block mr-2" size={20} />
          <h2 className="text-xl font-semibold inline-block">Failed to Load Data</h2>
          <p className="mt-2">Couldn't retrieve ward details. Please try again.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => router.back()}
          className="ml-4 text-gray-900 px-4 py-2 rounded-lg border hover:bg-gray-100 transition-colors"
        >
          Back to Wards
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-teal-600 hover:text-teal-800 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          Back to Ward
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-teal-600 p-3 rounded-lg mr-4">
              <Bed className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Ward</h1>
              <p className="text-teal-600 font-medium">Update ward information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Ward Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Ward Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter ward name"
              />
            </div>

            {/* Building */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Building <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="building"
                  value={form.building}
                  onChange={handleBuildingChange}
                  required
                  className="w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select building</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.building_type})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <Building2 size={18} />
                </div>
              </div>
            </div>

            {/* Floor */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Floor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="floor"
                  value={form.floor}
                  onChange={handleChange}
                  required
                  disabled={!form.building}
                  className={`w-full border border-gray-400 rounded-lg px-4 py-2 text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    !form.building ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select floor</option>
                  {floors.map(f => (
                    <option key={f.id} value={f.id}>
                      Level {f.number}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <Layers size={18} />
                </div>
              </div>
              {!form.building && (
                <p className="text-sm text-gray-500 mt-1">
                  Select a building first to choose a floor
                </p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
