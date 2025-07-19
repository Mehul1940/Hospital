'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Loader2,
  Clock as ClockIcon,
  Smartphone,
  Bed as BedIcon,
  User,
  AlertCircle,
  PhoneCall,
  Calendar as CalendarIcon,
  Edit3,
  Trash2,
} from 'lucide-react'
import { Calls, CallStatus, Device, Bed, Nurse } from '@/app/utils/types'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export default function ViewCallPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [call, setCall] = useState<Calls | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const fetchCall = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('access_token')
        if (!token) throw new Error('Not authenticated')

        // Fetch base record
        const res = await fetch(`${API_BASE_URL}/calls/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch call')
        const base = await res.json()

        // Fetch related resources
        const [devRes, bedRes, nurseRes] = await Promise.all([
          fetch(`${API_BASE_URL}/devices/${base.device}/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/beds/${base.bed}/`,    { headers: { Authorization: `Bearer ${token}` } }),
          base.nurse
            ? fetch(`${API_BASE_URL}/nurses/${base.nurse}/`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve({ ok: true, json: async () => null }),
        ])
        if (!devRes.ok)   throw new Error('Failed to fetch device')
        if (!bedRes.ok)   throw new Error('Failed to fetch bed')
        if (base.nurse && !nurseRes.ok) throw new Error('Failed to fetch nurse')

        const [deviceData, bedData, nurseData]: [Device, Bed, Nurse | null] =
          await Promise.all([devRes.json(), bedRes.json(), nurseRes.json()])

        setCall({
          ...base,
          device: deviceData,
          bed: bedData,
          nurse: nurseData,
        })
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load call details')
        toast.error(err.message || 'Failed to load call')
      } finally {
        setLoading(false)
      }
    }
    fetchCall()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`${API_BASE_URL}/calls/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete call')

      toast.success('Call deleted')
      router.push('/admin/calls')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const getStatusBadge = (status: CallStatus) => {
    const base = 'px-3 py-1 rounded-full text-sm font-medium'
    switch (status) {
      case 'pending':   return `${base} bg-yellow-100 text-yellow-800`
      case 'answered':  return `${base} bg-green-100 text-green-800`
      case 'cancelled': return `${base} bg-gray-100 text-gray-800`
      case 'urgent':    return `${base} bg-red-100 text-red-800`
      default:          return `${base} bg-blue-100 text-blue-800`
    }
  }

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
        <p className="text-gray-600">Loading call details…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => router.push('/admin/calls')}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-1" /> Back to calls
        </button>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <AlertCircle className="text-gray-400 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Call not found</h2>
        <p className="text-gray-600 mb-4">We couldn’t find that call record.</p>
        <button
          onClick={() => router.push('/admin/calls')}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
        >
          Back to Call Logs
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back & Title */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-teal-600 hover:text-teal-800 font-medium mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-1" /> Back to Call Logs
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="bg-teal-100 p-3 rounded-lg">
          <PhoneCall className="text-teal-600" size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Call Details</h1>
          <p className="text-gray-600">All the information about this patient call</p>
        </div>
      </div>

      {/* Details Panels */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Call Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClockIcon className="text-teal-600" /> Call Information
            </h2>
            <div className="space-y-4 text-gray-800">
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Status</div>
                <span className={getStatusBadge(call.status)}>{call.status}</span>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Call Time</div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-gray-500" />
                  {formatDateTime(call.call_time)}
                </div>
              </div>
              {call.response_time && (
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Response Time</div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="text-gray-500" />
                    {formatDateTime(call.response_time)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="text-teal-600" /> Assignment Details
            </h2>
            <div className="space-y-4 text-gray-800">
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Device</div>
                <div className="flex items-center gap-2">
                  <Smartphone className="text-gray-500" />
                  {call.device.serial_number}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Bed</div>
                <div className="flex items-center gap-2">
                  <BedIcon className="text-gray-500" />
                  {call.bed.number}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Nurse</div>
                <div className="flex items-center gap-2">
                  <User className="text-gray-500" />
                  {call.nurse?.name ?? 'Unassigned'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit & Delete */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/calls/${id}/edit`}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
          >
            <Edit3 size={18} /> Edit
          </Link>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <Trash2 size={18} /> {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete this call?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this call record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border text-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
