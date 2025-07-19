// File: app/admin/wards/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Loader2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Building,
  Layers,
  Bed,
  Trash2
} from 'lucide-react'
import { toast } from 'react-toastify'
import { confirmAlert } from 'react-confirm-alert'
import 'react-confirm-alert/src/react-confirm-alert.css'
import type { Ward, ExtendedWard, Building as BuildingType, Floor } from '@/app/utils/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

export default function WardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ward, setWard] = useState<ExtendedWard | null>(null)
  const [building, setBuilding] = useState<BuildingType | null>(null)
  const [floor, setFloor] = useState<Floor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('access_token') || ''
      try {
        setLoading(true)
        setError(false)

        // 1) load ward
        const wardRes = await fetch(`${API_URL}/wards/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!wardRes.ok) throw new Error()
        const wardData: Ward = await wardRes.json()

        // placeholder
        setWard({ ...wardData, building_name: '…', floor_number: 0 })

        // fetch building & floor
        const [bRes, fRes] = await Promise.all([
          fetch(`${API_URL}/buildings/${wardData.building}/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/floors/${wardData.floor}/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        if (!bRes.ok || !fRes.ok) throw new Error()

        const bData = await bRes.json() as BuildingType
        const fData = await fRes.json() as Floor

        setBuilding(bData)
        setFloor(fData)
        setWard({
          ...wardData,
          building_name: bData.name,
          floor_number: fData.number
        })

      } catch {
        toast.error('Failed to load ward details')
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = () => {
    confirmAlert({
      title: 'Confirm Deletion',
      message: `Delete ward “${ward?.name}”? This action cannot be undone.`,
      buttons: [
        {
          label: 'Delete',
          onClick: async () => {
            setDeleting(true)
            const token = localStorage.getItem('access_token') || ''
            try {
              const res = await fetch(`${API_URL}/wards/${id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              })
              if (!res.ok) throw new Error()
              toast.success('Ward deleted successfully')
              router.push('/admin/wards')
            } catch {
              toast.error('Failed to delete ward')
              setDeleting(false)
            }
          }
        },
        { label: 'Cancel', onClick: () => {} }
      ]
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-600 h-12 w-12" />
        <p className="mt-4 text-gray-900">Loading ward details...</p>
      </div>
    )
  }

  if (error || !ward) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Failed to Load Ward</h2>
          <p>Couldn’t retrieve ward details. Try again.</p>
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-teal-600 hover:text-teal-800 transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          Back to Wards
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="bg-teal-600 p-3 rounded-lg mr-4">
              <Bed className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ward {ward.name}</h1>
              <p className="text-teal-600 font-medium">Ward Details</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            {/* explicit router.push for edit */}
            <button
              onClick={() => router.push(`/admin/wards/${ward.id}/edit`)}
              className="flex items-center gap-2 bg-white text-teal-600 border border-teal-300 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors shadow-sm"
            >
              <Edit3 size={18} /> Edit Ward
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50"
            >
              {deleting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={18} />}
              Delete
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900">
          {/* Building Info */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <div className="flex items-center mb-4">
              <Building className="text-teal-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold">Building Info</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span>Building Name</span>
                <span className="font-medium">{ward.building_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Building Type</span>
                <span className="font-medium">{building?.building_type ?? '—'}</span>
              </div>
            </div>
          </div>
          {/* Floor Info */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <div className="flex items-center mb-4">
              <Layers className="text-teal-600 mr-3" size={20} />
              <h2 className="text-lg font-semibold">Floor Info</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span>Floor Number</span>
                <span className="font-medium">{ward.floor_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Floor Manager</span>
                <span className="font-medium">{floor?.floor_manager || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
