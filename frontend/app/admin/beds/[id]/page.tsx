'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  TrashIcon,
  ArrowLeftIcon,
  HospitalIcon,
  BedIcon,
  Pencil
} from 'lucide-react'

interface Bed {
  id: string
  number: string
  ward: string
  wardName?: string
  description?: string
  status?: 'available' | 'occupied' | 'maintenance'
}

export default function ViewBedPage() {
  const { id } = useParams()
  const router = useRouter()
  const [bed, setBed] = useState<Bed | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const fetchBed = async () => {
      try {
        setIsLoading(true)
        setError('')

        const token = localStorage.getItem('access_token') || ''
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.status === 404) {
          toast.error('Bed not found')
          router.push('/beds')
          return
        }

        if (res.status === 401) {
          toast.error('Session expired')
          router.push('/login')
          return
        }

        if (!res.ok) throw new Error(`Failed to fetch bed (HTTP ${res.status})`)

        const data: Bed = await res.json()
        setBed(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        toast.error('Failed to load bed details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBed()
  }, [id, router])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('access_token') || ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error(`Failed to delete bed (HTTP ${res.status})`)

      toast.success('Bed deleted successfully')
      router.push('/beds')
    } catch (err) {
      toast.error('Failed to delete bed')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-t-teal-700 rounded-full"></div>
      </div>
    )
  }

  if (error || !bed) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-teal-700 hover:text-teal-900 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Beds
        </button>
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow">
          <p className="font-bold">Error:</p>
          <p>{error || 'Bed not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-teal-700 hover:text-teal-900 mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Beds
      </button>

      <div className="bg-white rounded-2xl shadow-lg border">
        {/* Header */}
        <div className="bg-teal-600 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BedIcon className="w-8 h-8" />
                Bed {bed.number}
              </h1>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <BedIcon className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <DetailItem label="Bed Number" value={bed.number} />
          {bed.status && (
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-block text-sm font-medium px-3 py-1 rounded-full
                    ${bed.status === 'available' ? 'bg-green-100 text-green-700' : ''}
                    ${bed.status === 'occupied' ? 'bg-red-100 text-red-700' : ''}
                    ${bed.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : ''}
                  `}
                >
                  {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                </span>
              </dd>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2.5 rounded-lg"
          >
            <TrashIcon className="w-5 h-5" />
            Delete Bed
          </button>
          <button
            onClick={() => router.push(`/admin/beds/${id}/edit`)}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2.5 rounded-lg"
          >
            <Pencil className="w-5 h-5" />
            Edit Bed
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-full">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg text-gray-700">Delete Bed?</h2>
                <p className="text-gray-600 mt-1">
                  Are you sure you want to delete <strong>Bed {bed.number}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
              type="button"
              onClick={() => router.push(`/admin/beds/`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-b-2 border-white rounded-full mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Bed'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-lg text-gray-800 font-semibold">{value}</dd>
  </div>
)


