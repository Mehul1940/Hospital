'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Pencil, ArrowLeft, Loader, Trash2, Building, Layers } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

interface Floor {
  id: string
  number: number
  building: string
  buildingName?: string
  level: number
  description: string
}

interface BuildingType {
  id: string
  name: string
}

export default function ViewFloorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [floor, setFloor] = useState<Floor | null>(null)
  const [building, setBuilding] = useState<BuildingType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('access_token') || ''
        
        // Fetch floor data
        const floorRes = await fetch(`${API_URL}/floors/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!floorRes.ok) throw new Error('Failed to load floor details')
        const floorData: Floor = await floorRes.json()
        setFloor(floorData)
        
        // Fetch building data if available
        if (floorData.building) {
          const buildingRes = await fetch(`${API_URL}/buildings/${floorData.building}/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (buildingRes.ok) {
            const buildingData: BuildingType = await buildingRes.json()
            setBuilding(buildingData)
          }
        }
      } catch (error) {
        console.error('Fetch error:', error)
        toast.error('Failed to load floor details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleDelete = async () => {
    if (!floor) return
    
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('access_token') || ''
      const response = await fetch(`${API_URL}/floors/${floor.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Delete failed')
      
      toast.success('Floor deleted successfully')
      router.push('/admin/floors')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete floor')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex flex-col items-center justify-center h-64">
        <Loader className="animate-spin h-10 w-10 text-teal-600 mb-4" />
        <p className="text-gray-600">Loading floor details...</p>
      </div>
    )
  }

  if (!floor) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center py-12">
          <Layers className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">Floor Not Found</h2>
          <p className="text-gray-500 mb-6">The requested floor could not be found</p>
          <button
            onClick={() => router.push('/admin/floors')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 inline-flex items-center"
          >
            <ArrowLeft className="mr-2" size={18} />
            Back to Floors
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2" size={20} />
          Back
        </button>
        
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center transition-colors"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
          <button
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center transition-colors"
            onClick={() => router.push(`/admin/floors/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Floor {floor.number}</h1>
              <p className="flex items-center mt-1">
                <Building className="h-5 w-5 mr-2 text-teal-200" />
                <span className="text-teal-100">
                  {building?.name || `Building ${floor.building}`}
                </span>
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Layers className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-800">Delete Floor?</h2>
                <p className="mt-2 text-gray-600">
                  Are you sure you want to delete <span className="font-semibold">Floor {floor.number}</span>? 
                  This action cannot be undone and all associated data will be permanently removed.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader className="animate-spin mr-2" size={18} />
                    Deleting...
                  </>
                ) : (
                  'Delete Floor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}