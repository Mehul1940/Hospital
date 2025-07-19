'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Eye, Edit3, PlusCircle, Loader2, RefreshCw,
  Clock, Smartphone, Bed, User, AlertCircle, Search
} from 'lucide-react'
import { Calls, CallStatus, Device, Bed as BedType, Nurse } from '@/app/utils/types'
import toast from 'react-hot-toast'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

export default function CallListPage() {
  useAuthRedirect()
  const [calls, setCalls] = useState<Calls[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null
      const API_BASE = process.env.NEXT_PUBLIC_API_URL
      if (!token || !API_BASE) {
        throw new Error('Missing API URL or auth token')
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }

      const [callsRes, devicesRes, bedsRes, nursesRes] = await Promise.all([
        fetch(`${API_BASE}/calls/`, { headers }),
        fetch(`${API_BASE}/devices/`, { headers }),
        fetch(`${API_BASE}/beds/`, { headers }),
        fetch(`${API_BASE}/nurses/`, { headers }),
      ])

      if (!callsRes.ok)    throw new Error('Could not load calls')
      if (!devicesRes.ok)  throw new Error('Could not load devices')
      if (!bedsRes.ok)     throw new Error('Could not load beds')
      if (!nursesRes.ok)   throw new Error('Could not load nurses')

      const [rawCalls, devices, beds, nurses] = await Promise.all([
        callsRes.json(),
        devicesRes.json(),
        bedsRes.json(),
        nursesRes.json(),
      ])

      const devMap = new Map<string, Device>(devices.map((d: Device) => [d.id, d]))
      const bedMap = new Map<string, BedType>(beds.map((b: BedType) => [b.id, b]))
      const nurseMap = new Map<string, Nurse>(nurses.map((n: Nurse) => [n.id, n]))

      const populated: Calls[] = rawCalls.map((c: any) => ({
        ...c,
        device: devMap.get(c.device) || { id: c.device, serial_number: 'Unknown', bed: '' },
        bed:    bedMap.get(c.bed)    || { id: c.bed, number: 'Unknown', ward: '' },
        nurse:  c.nurse
                ? nurseMap.get(c.nurse) || null
                : null,
      }))

      setCalls(populated)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong')
      toast.error(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const getStatusBadge = (status: CallStatus) => {
    const base = 'px-2.5 py-1 rounded-full text-xs font-medium'
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
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  
  const filteredCalls = calls.filter(call => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = (
      call.device.serial_number.toLowerCase().includes(term) ||
      call.bed.number.toLowerCase().includes(term) ||
      (call.nurse?.name.toLowerCase().includes(term) ?? false)
    )
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Clock className="text-teal-600" size={28} /> Call Logs
          </h1>
          <p className="text-gray-600 mt-2">Track and manage all patient call records</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            {loading
              ? <Loader2 className="animate-spin" size={18} />
              : <RefreshCw size={18} />}
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/admin/calls/add"
            className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600
                       text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md"
          >
            <PlusCircle size={18} /> <span className="hidden sm:inline">Add Call</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search devices, beds, nurses..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl
                         focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5
                         focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-800"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CallStatus | 'all')}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="cancelled">Cancelled</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          {/* Count */}
          <div className="flex items-center justify-end text-sm text-gray-600">
            {filteredCalls.length} {filteredCalls.length === 1 ? 'call' : 'calls'} found
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin size-12 text-teal-600 mb-4" />
            <p className="text-gray-600">Loading call logs...</p>
          </div>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Clock className="text-gray-500" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No call logs found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try changing your search or filter criteria' 
              : 'There are no calls recorded in the system yet.'}
          </p>
          <Link
            href="/admin/calls/add"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5
                       rounded-lg font-medium transition"
          >
            <PlusCircle size={16} /> Create First Call
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3 flex items-center gap-2"><Smartphone size={14} /> Device</div>
            <div className="col-span-2 flex items-center gap-2"><Bed size={14} /> Bed</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 flex items-center gap-2"><User size={14} /> Nurse</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {filteredCalls.map(call => (
              <div
                key={call.id}
                className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-gray-50 transition"
              >
                {/* Device */}
                <div className="md:col-span-3 mb-3 md:mb-0">
                  <div className="md:hidden text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <Smartphone size={14} /> Device
                  </div>
                  <div className="font-medium text-gray-900">{call.device.serial_number}</div>
                </div>

                {/* Bed */}
                <div className="md:col-span-2 mb-3 md:mb-0">
                  <div className="md:hidden text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <Bed size={14} /> Bed
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {call.bed.number}
                  </span>
                </div>

                {/* Status */}
                <div className="md:col-span-2 mb-3 md:mb-0">
                  <div className="md:hidden text-xs text-gray-500 mb-1">Status</div>
                  <span className={getStatusBadge(call.status)}>{call.status}</span>
                </div>

                {/* Nurse */}
                <div className="md:col-span-2 mb-3 md:mb-0">
                  <div className="md:hidden text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <User size={14} /> Nurse
                  </div>
                  {call.nurse
                    ? <span className="font-medium text-gray-900">{call.nurse.name}</span>
                    : <span className="text-gray-400 italic">Unassigned</span>}
                </div>

                {/* Time */}
                <div className="md:col-span-2 mb-4 md:mb-0">
                  <div className="md:hidden text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <Clock size={14} /> Time
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {formatDateTime(call.call_time)}
                  </span>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex gap-4 justify-end md:justify-start">
                  <Link 
                    href={`/admin/calls/${call.id}`} 
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Eye size={18} />
                    <span className="md:hidden">View</span>
                  </Link>
                  <Link 
                    href={`/admin/calls/${call.id}/edit`} 
                    className="text-green-600 hover:text-green-800 flex items-center gap-1"
                  >
                    <Edit3 size={18} />
                    <span className="md:hidden">Edit</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
