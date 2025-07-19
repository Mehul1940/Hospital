'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Hospital,
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  Activity,
  Globe
} from 'lucide-react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'
import { Hospitals } from '@/app/utils/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'


export default function HospitalDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [hospital, setHospital] = useState<Hospitals | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchHospital = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('You are not logged in.')
        router.push('/login')
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/hospitals/${id}/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch hospital details')
        }

        const data = await response.json()
        setHospital(data)
      } catch (error) {
        console.error('Error fetching hospital:', error)
        toast.error('Failed to load hospital details')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchHospital()
  }, [id, router])

  const handleDelete = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('Authentication token missing')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/hospitals/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete hospital')
      }

      toast.success('Hospital deleted successfully')
      router.push('/admin/hospitals')
    } catch (error) {
      console.error('Error deleting hospital:', error)
      toast.error('Failed to delete hospital')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!hospital) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Hospital className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Hospital Not Found</h1>
        <p className="text-gray-600 mt-2 mb-6">
          The hospital you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => router.push('/admin/hospitals')}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Back to Hospitals
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/admin/hospitals')}
          className="flex items-center text-teal-600 hover:text-teal-800 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Hospitals
        </button>

        <div className="flex gap-3">
          <Link
            href={`/admin/hospitals/${id}/edit`}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {deleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-700"></div>
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Hospital className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{hospital.name}</h1>
              {hospital.speciality && (
                <p className="text-teal-100 mt-1">{hospital.speciality}</p>
              )}
            </div>
          </div>
        </div>

       <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/** Address Section */}
            <div className="flex items-start gap-4 w-full md:w-1/2">
              <div className="bg-teal-50 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Address</h2>
                <p className="mt-1 text-gray-800">{hospital.address}</p>
              </div>
            </div>

            {/** Phone Section */}
            {hospital.phone_number && (
              <div className="flex items-start gap-4 w-full md:w-1/2">
                <div className="bg-teal-50 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-500">Phone</h2>
                  <p className="mt-1 text-gray-800">{hospital.phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="text-center">
              <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Hospital</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{hospital.name}</span>? This action cannot be undone.
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {deleting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Deleting...
                    </div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
