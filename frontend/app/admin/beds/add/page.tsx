'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { PlusCircle, ArrowLeft, BedDouble, Loader } from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface Ward {
  id: string
  name: string
}

export default function AddBedPage() {
  useAuthRedirect()
  const router = useRouter()
  const [number, setNumber] = useState('')
  const [wardId, setWardId] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wards, setWards] = useState<Ward[]>([])

  useEffect(() => {
    const fetchWards = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('access_token') || ''
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wards/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!res.ok) {
          if (res.status === 401) {
            toast.error('Session expired. Please log in again.')
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch wards')
        }
        
        const data = await res.json()
        setWards(data)
        if (data.length > 0) setWardId(data[0].id)
      } catch (error) {
        console.error('Error fetching wards:', error)
        toast.error('Failed to load wards')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWards()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number.trim() || !wardId) return
    
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem('access_token') || ''
      
      // Corrected request body structure
      const requestBody = {
        number: number.trim(),
        ward: wardId,
        description: description.trim() || null
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!res.ok) {
        // Try to get detailed error message
        let errorMessage = 'Failed to add bed'
        try {
          const errorData = await res.json()
          if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors.join(', ')
          }
        } catch (e) {
          console.error('Error parsing error response:', e)
        }
        throw new Error(errorMessage)
      }
      
      toast.success('Bed added successfully!', {
        icon: <BedDouble className="w-5 h-5 text-teal-500" />
      })
      router.push('/admin/beds')
    } catch (err: any) {
      console.error('Add bed error:', err)
      toast.error(err.message || 'Error adding bed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-600 hover:text-teal-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Beds
        </button>
        
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-lg">
            <BedDouble className="text-teal-600 h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Bed</h1>
        </div>
        <p className="text-gray-600 mt-2">Create a new hospital bed record</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="bedNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Bed Number *
            </label>
           <input
                id="bedNumber"
                type="text"
                placeholder="Enter bed number (e.g., B-101)"
                value={number}
                onChange={e => setNumber(e.target.value)}
                className="w-full border border-gray-500 text-gray-800 placeholder-gray-600 bg-gray-100 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition"
                required
                maxLength={20}
                />
          </div>

          <div>
            <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
              Ward *
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="animate-spin text-gray-500 w-5 h-5 mr-2" />
                <span>Loading wards...</span>
              </div>
            ) : wards.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-yellow-700">No wards available. Please create a ward first.</p>
              </div>
            ) : (
             <select
                id="ward"
                value={wardId}
                onChange={e => setWardId(e.target.value)}
                className="w-full border border-gray-500 text-gray-800 bg-gray-100 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition"
                required
                >
                {wards.map(ward => (
                    <option key={ward.id} value={ward.id}>
                    {ward.name}
                    </option>
                ))}
                </select>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/beds')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || wards.length === 0}
              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin w-4 h-4" />
                  <span>Adding Bed...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>Add Bed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}