'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Pencil, 
  Trash2, 
  User, 
  ClipboardList,
  Mail,
  Shield,
  Calendar,
  ChevronRight
} from 'lucide-react'

export default function NurseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [nurse, setNurse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNurse = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('access_token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nurses/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Nurse not found')
          } else {
            throw new Error('Failed to fetch nurse details')
          }
          return
        }
        
        const data = await res.json()
        setNurse(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load nurse'
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchNurse()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this nurse? This action cannot be undone.')) return
    
    setIsDeleting(true)
    
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nurses/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to delete nurse')
      }

      toast.success('Nurse deleted successfully')
      router.push('/admin/nurses')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting nurse'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <Loader2 className="animate-spin w-12 h-12 text-teal-600" />
          <div className="absolute inset-0 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading nurse details...</p>
        <p className="text-gray-500 mt-1">Please wait while we fetch the information</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Error loading nurse</h3>
              <p className="mt-2 text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/admin/nurses')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Nurses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!nurse) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center">
            <User className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-gray-900">Nurse Not Found</h3>
          <p className="mt-2 text-gray-500">The nurse you're looking for doesn't exist or may have been removed.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/admin/nurses')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Nurses
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/nurses')}
            className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Nurses
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Nurse Details</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/admin/nurses/${id}/edit`)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Nurse
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-70"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Nurse
              </>
            )}
          </button>
        </div>
      </div>

      {/* Nurse Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="h-15 bg-teal-500 to-teal-50 px-6 py-4 border-b border-gray-200">
        </div>

        <div className="p-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 text-gray-500 mr-2" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nurse ID</h4>
                  <p className="text-gray-700 font-mono text-sm mt-1 flex items-center">
                    <ClipboardList className="w-4 h-4 mr-2 text-teal-600" />
                    {nurse.nurse_id}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{nurse.name}</p>
                </div>
                
                {nurse.email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="text-gray-700 mt-1 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-teal-600" />
                      {nurse.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-500">
          <p>Nurse registered in the system</p>
        </div>
      </div>
    </div>
  )
}