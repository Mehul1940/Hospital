'use client'

import {
  Building2, Handshake, PlusCircle, Eye, Edit3, Search, ArrowUpDown,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { UUID, StaffTeam, Ward, Floor } from '@/app/utils/types'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface RawAssignment {
  id: UUID
  team: UUID
  ward: UUID
  floor: UUID
}

interface PopulatedTeamAssignment {
  id: UUID
  team: Partial<StaffTeam>
  ward: Partial<Ward>
  floor: Partial<Floor>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_URL is not defined')

export default function TeamAssignmentList() {
  useAuthRedirect()
  const router = useRouter()
  const [assignments, setAssignments] = useState<PopulatedTeamAssignment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PopulatedTeamAssignment | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  useEffect(() => {
    const fetchAssignments = async () => {
      const token = localStorage.getItem('access_token') || ''
      if (!token) {
        toast.error('Login required')
        router.push('/login')
        return
      }

      try {
        const headers = { Authorization: `Bearer ${token}` }
        const res = await fetch(`${API_BASE_URL}/team-assignments/`, { headers })
        if (!res.ok) throw new Error('Failed to fetch assignments')
        const rawData: RawAssignment[] = await res.json()

        const enrichedData = await Promise.all(
          rawData.map(async (a): Promise<PopulatedTeamAssignment> => {
            const [teamRes, wardRes, floorRes] = await Promise.all([
              fetch(`${API_BASE_URL}/staff-teams/${a.team}/`, { headers }),
              fetch(`${API_BASE_URL}/wards/${a.ward}/`, { headers }),
              fetch(`${API_BASE_URL}/floors/${a.floor}/`, { headers }),
            ])

            const team = teamRes.ok ? await teamRes.json() : {}
            const ward = wardRes.ok ? await wardRes.json() : {}
            const floor = floorRes.ok ? await floorRes.json() : {}

            return { id: a.id, team, ward, floor }
          })
        )

        setAssignments(enrichedData)
      } catch (error) {
        console.error('Fetch error:', error)
        toast.error('Could not load team assignments')
      }
    }

    fetchAssignments()
  }, [router])

  const filteredAssignments = assignments.filter((a) => {
    const teamName = a.team?.name?.toLowerCase() || ''
    const wardName = a.ward?.name?.toLowerCase() || ''
    const floorNumber = a.floor?.number?.toString() || ''
    const term = searchTerm.toLowerCase()

    return (
      teamName.includes(term) ||
      wardName.includes(term) ||
      floorNumber.includes(term)
    )
  })

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (!sortConfig.key) return 0

    const getValue = (entry: PopulatedTeamAssignment): string => {
      switch (sortConfig.key) {
        case 'team': return entry.team?.name?.toLowerCase() || ''
        case 'ward': return entry.ward?.name?.toLowerCase() || ''
        case 'floor': return entry.floor?.number?.toString() || ''
        default: return entry.id.toLowerCase()
      }
    }

    const aVal = getValue(a)
    const bVal = getValue(b)

    return sortConfig.direction === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal)
  })

  const requestSort = (key: keyof PopulatedTeamAssignment) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    setSortConfig({ key, direction })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Handshake className="h-8 w-8 text-teal-600" />
          <h1 className="text-2xl font-bold text-gray-800">Team Assignments</h1>
          <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {assignments.length} assignments
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by team, ward, or floor..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-300 focus:border-teal-500 w-full sm:w-64 text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Link href="/admin/team_assignments/add">
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
              <PlusCircle className="h-5 w-5" />
              Add New
            </button>
          </Link>
        </div>
      </div>

      {sortedAssignments.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200 max-w-2xl mx-auto">
          <Building2 className="h-16 w-16 mx-auto text-gray-400" strokeWidth={1} />
          <h3 className="text-xl font-medium text-gray-700 mt-4">No team assignments found</h3>
          <p className="text-gray-500 mt-2 mb-4 max-w-md mx-auto">
            Get started by creating a new team assignment to organize your nursing teams efficiently.
          </p>
          <Link href="/admin/team_assignments/add">
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto">
              <PlusCircle className="h-5 w-5" />
              Create Your First Assignment
            </button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { label: 'Team', key: 'team' },
                  { label: 'Ward', key: 'ward' },
                  { label: 'Floor', key: 'floor' }
                ].map(({ label, key }) => (
                  <th
                    key={key}
                    onClick={() => requestSort(key as keyof PopulatedTeamAssignment)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAssignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{a.team?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{a.ward?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">Floor {a.floor?.number ?? '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/team_assignments/${a.id}`}>
                        <button className="text-teal-600 hover:text-teal-800 flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg">
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </Link>
                      <Link href={`/admin/team_assignments/${a.id}/edit`}>
                        <button className="text-green-600 hover:text-green-800 flex items-center gap-1 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg">
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
