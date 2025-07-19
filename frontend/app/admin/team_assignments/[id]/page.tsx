'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Link from 'next/link'
import {
  ArrowLeft, Edit3, Trash2, RefreshCw, Handshake,
  Users, Home, Layers, AlertCircle, Loader2
} from 'lucide-react'
import { UUID, StaffTeam, Ward, Floor } from '@/app/utils/types'

interface RawAssignment {
  id: UUID
  team: UUID
  ward: UUID
  floor: UUID
}

interface AssignmentDetails {
  id: UUID
  team: Partial<StaffTeam>
  ward: Partial<Ward>
  floor: Partial<Floor>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export default function TeamAssignmentView() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [resourceErrors, setResourceErrors] = useState({ team: false, ward: false, floor: false })

  const fetchAssignment = async () => {
    const token = localStorage.getItem('access_token') || ''
    if (!token) {
      toast.error('Authentication required')
      return router.push('/login')
    }

    try {
      setLoading(true)
      setError(false)
      setResourceErrors({ team: false, ward: false, floor: false })

      const headers = { Authorization: `Bearer ${token}` }
      const assignmentRes = await fetch(`${API_BASE_URL}/team-assignments/${id}/`, { headers })

      if (assignmentRes.status === 404) {
        toast.error('Assignment not found')
        return router.push('/admin/team_assignments')
      }

      if (!assignmentRes.ok) throw new Error('Failed to fetch assignment')
      const rawData: RawAssignment = await assignmentRes.json()

      const [teamRes, wardRes, floorRes] = await Promise.all([
        fetch(`${API_BASE_URL}/staff-teams/${rawData.team}/`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/wards/${rawData.ward}/`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/floors/${rawData.floor}/`, { headers }).catch(() => ({ ok: false }))
      ])

      setResourceErrors({
        team: !teamRes.ok,
        ward: !wardRes.ok,
        floor: !floorRes.ok
      })

      if (!teamRes.ok || !wardRes.ok || !floorRes.ok) {
        toast.warning('Some assignment details could not be loaded')
      }

      const teamData = teamRes.ok ? await (teamRes as Response).json() : {}
      const wardData = wardRes.ok ? await (wardRes as Response).json() : {}
      const floorData = floorRes.ok ? await (floorRes as Response).json() : {}

      setAssignment({
        id: rawData.id,
        team: teamData,
        ward: wardData,
        floor: floorData
      })
    } catch (err) {
      console.error('Fetch error:', err)
      setError(true)
      toast.error('Error loading assignment details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setConfirmDelete(false)
    const token = localStorage.getItem('access_token') || ''
    if (!token) return router.push('/login')

    try {
      setDeleting(true)
      const res = await fetch(`${API_BASE_URL}/team-assignments/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error(res.statusText)

      toast.success('Assignment deleted successfully')
      router.push('/admin/team_assignments')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Could not delete assignment')
    } finally {
      setDeleting(false)
    }
  }

  const handleRefresh = () => fetchAssignment()

  useEffect(() => {
    fetchAssignment()
  }, [id])

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Assignment</h1>
        <p className="text-gray-600 mb-6">Please check your connection and try again.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </button>
          <Link href="/admin/team_assignments">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !assignment) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading assignment details...</p>
      </div>
    )
  }

  const { team, ward, floor } = assignment

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto bg-red-100 text-red-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Assignment?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently remove the assignment between <b>{team?.name || 'Team'}</b> and <b>{ward?.name || 'Ward'}</b>.
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 border border-gray-700 text-black rounded-lg ">Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center"
                >
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-3 rounded-full">
            <Handshake className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Assignment Details</h1>
            <p className="text-gray-600 text-sm">ID: {assignment.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/team_assignments/${id}/edit`}>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-6 space-y-6">
          {/* Team */}
          <section>
            <h2 className="text-lg font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Team Information
            </h2>
            {resourceErrors.team ? (
              <p className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Failed to load team
              </p>
            ) : (
              <p className="font-medium text-gray-900">{team?.name}</p>
            )}
          </section>

          {/* Location */}
          <section className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm text-gray-500 flex items-center gap-1">
                <Home className="w-4 h-4 text-indigo-500" />
                Ward
              </h3>
              {resourceErrors.ward ? (
                <p className="text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Failed to load ward</p>
              ) : (
                <p className="font-medium text-gray-900">{ward?.name}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm text-gray-500 flex items-center gap-1">
                <Layers className="w-4 h-4 text-purple-500" />
                Floor
              </h3>
              {resourceErrors.floor ? (
                <p className="text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Failed to load floor</p>
              ) : (
                <p className="font-medium text-gray-900">Floor {floor?.number}</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Link href="/admin/team_assignments">
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-800 py-2 px-4 rounded-lg transition">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </Link>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
