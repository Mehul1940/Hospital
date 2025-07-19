'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Loader2,
  Clock as ClockIcon,
  PlusCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  CallStatus,
  Device,
  Bed,
  Nurse,
  Ward
} from '@/app/utils/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL!

export default function EditCallPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [formData, setFormData] = useState({
    device: '',
    bed: '',
    call_time: '',
    status: 'pending' as CallStatus,
    nurse: '',
    notes: '',
  })

  const [devices, setDevices] = useState<Device[]>([])
  const [beds, setBeds]       = useState<Bed[]>([])
  const [wards, setWards]     = useState<Ward[]>([])
  const [nurses, setNurses]   = useState<Nurse[]>([])

  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]         = useState<Record<string,string>>({})

  // 1) Load both the existing call and all dropdowns
  useEffect(() => {
    let mounted = true

    async function loadAll() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access_token')
        if (!token) throw new Error('Not authenticated')

        const headers = { Authorization: `Bearer ${token}` }

        // Fetch call + lists in parallel
        const [
          callRes,
          devicesRes,
          bedsRes,
          wardsRes,
          nursesRes
        ] = await Promise.all([
          fetch(`${API_BASE}/calls/${id}/`, { headers }),
          fetch(`${API_BASE}/devices/`,       { headers }),
          fetch(`${API_BASE}/beds/`,          { headers }),
          fetch(`${API_BASE}/wards/`,         { headers }),
          fetch(`${API_BASE}/nurses/`,        { headers }),
        ])

        if (!callRes.ok)   throw new Error('Failed to load call')
        if (!devicesRes.ok) throw new Error('Failed to load devices')
        if (!bedsRes.ok)    throw new Error('Failed to load beds')
        if (!wardsRes.ok)   throw new Error('Failed to load wards')
        if (!nursesRes.ok)  throw new Error('Failed to load nurses')

        const [c, ds, bs, ws, ns] = await Promise.all([
          callRes.json(),
          devicesRes.json(),
          bedsRes.json(),
          wardsRes.json(),
          nursesRes.json(),
        ])

        if (!mounted) return

        // populate dropdowns
        setDevices(ds)
        setBeds(bs)
        setWards(ws)
        setNurses(ns)

        // format call_time for <input type="datetime-local">
        const localDT = c.call_time
          ? format(parseISO(c.call_time), "yyyy-MM-dd'T'HH:mm")
          : ''

        setFormData({
          device:    c.device,
          bed:       c.bed,
          call_time: localDT,
          status:    c.status,
          nurse:     c.nurse || '',
          notes:     c.notes || '',
        })
      } catch (e: any) {
        toast.error(e.message)
        setErrors({ general: e.message })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadAll()
    return () => { mounted = false }
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target
    setFormData(f => ({ ...f, [name]: value }))
    setErrors({})
  }

  const validate = () => {
    const errs: Record<string,string> = {}
    if (!formData.device)    errs.device    = 'Required'
    if (!formData.bed)       errs.bed       = 'Required'
    if (!formData.call_time) errs.call_time = 'Required'
    setErrors(errs)
    return !Object.keys(errs).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the errors')
      return
    }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('access_token')!
      const res = await fetch(`${API_BASE}/calls/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`,
        },
        body: JSON.stringify({
          device:    formData.device,
          bed:       formData.bed,
          call_time: new Date(formData.call_time).toISOString(),
          status:    formData.status,
          nurse:     formData.nurse || null,
          notes:     formData.notes,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.detail || 'Update failed')
      }
      toast.success('Call updated!')
      router.push('/admin/calls')
    } catch (e: any) {
      toast.error(e.message)
      setErrors({ general: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = () => router.push('/admin/calls')

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-teal-600" size={32}/>
        <p className="ml-3 text-gray-700">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowLeft className="cursor-pointer text-gray-800" size={20} onClick={goBack}/>
        <ClockIcon className="text-teal-600" size={24}/>
        <h1 className="text-2xl font-bold text-gray-800">Edit Call</h1>
      </div>

      {errors.general && (
        <div className="bg-red-100 p-3 rounded mb-4 text-red-700 flex items-center">
          <AlertCircle className="mr-2"/> {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Device */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">Device *</label>
          <select
            name="device"
            value={formData.device}
            onChange={handleChange}
            disabled={submitting}
            className={`w-full border px-3 py-2 rounded text-gray-800 focus:ring-2 focus:ring-teal-500 ${
              errors.device ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">— choose —</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.serial_number}</option>
            ))}
          </select>
          {errors.device && <p className="mt-1 text-red-600 text-sm">{errors.device}</p>}
        </div>

        {/* Bed */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">Bed *</label>
          <select
            name="bed"
            value={formData.bed}
            onChange={handleChange}
            disabled={submitting}
            className={`w-full border px-3 py-2 rounded text-gray-800 focus:ring-2 focus:ring-teal-500 ${
              errors.bed ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">— choose —</option>
            {beds.map(b => {
              const name = wards.find(w => w.id===b.ward)?.name || 'Unknown'
              return <option key={b.id} value={b.id}>{b.number} (ward {name})</option>
            })}
          </select>
          {errors.bed && <p className="mt-1 text-red-600 text-sm">{errors.bed}</p>}
        </div>

        {/* Call Time */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">Call Time *</label>
          <input
            type="datetime-local"
            name="call_time"
            value={formData.call_time}
            onChange={handleChange}
            disabled={submitting}
            className={`w-full border px-3 py-2 rounded text-gray-800 focus:ring-2 focus:ring-teal-500 ${
              errors.call_time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.call_time && <p className="mt-1 text-red-600 text-sm">{errors.call_time}</p>}
        </div>

        {/* Status */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={submitting}
            className="w-full border border-gray-300 px-3 py-2 rounded text-gray-800 focus:ring-2 focus:ring-teal-500"
          >
            <option value="pending">Pending</option>
            <option value="answered">Answered</option>
            <option value="cancelled">Cancelled</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Nurse */}
        <div>
          <label className="block mb-1 font-medium text-gray-800">Nurse (optional)</label>
          <select
            name="nurse"
            value={formData.nurse}
            onChange={handleChange}
            disabled={submitting}
            className="w-full border border-gray-300 px-3 py-2 rounded text-gray-800 focus:ring-2 focus:ring-teal-500"
          >
            <option value="">— none —</option>
            {nurses.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
          >
            <PlusCircle size={16} />{submitting ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
