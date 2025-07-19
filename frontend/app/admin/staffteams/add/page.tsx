'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { ArrowLeft, Plus, Loader2, PlusCircle } from 'lucide-react'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

export default function AddStaffTeamPage() {
  useAuthRedirect()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Team name cannot be empty')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff-teams/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to create staff team')
      }

      toast.success('Team created successfully!')
      router.push('/admin/staffteams')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/staffteams')}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Staff Teams
        </button>
      </div>

      {/* Card Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="h-15 bg-teal-500 px-6 py-4 border-b border-gray-200" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-gray-900"
                placeholder="Enter team name (e.g., Cardiology Nursing Team)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Choose a descriptive name that identifies this team's specialty or assignment.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/staffteams')}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`flex items-center px-5 py-2.5 rounded-lg text-white font-medium transition shadow-sm ${
                loading || !name.trim()
                  ? 'bg-teal-400 cursor-not-allowed'
                  : 'bg-teal-800 hover:bg-teal-900'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Create Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-teal-50 border border-teal-100 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-teal-800 mb-3">About Staff Teams</h2>
        <ul className="space-y-2 text-sm text-teal-700">
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Staff teams group nurses together for assignments</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Teams can be assigned to specific wards or floors</p>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-teal-500">•</div>
            <p className="ml-2">Use descriptive names to identify team specialties</p>
          </li>
        </ul>
      </div>
    </div>
  )
}
