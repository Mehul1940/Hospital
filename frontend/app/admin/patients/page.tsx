'use client'

import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { Loader2, PlusCircle, Search, Edit, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { BASE_URL, getAuthHeaders } from '@/app/utils/api'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

interface Bed {
  id: string
  number: string
}

interface Nurse {
  id: string
  name: string
}

interface Device {
  id: string
  serial_number: string
}

interface RawPatient {
  id: string
  name: string
  age: number
  gender: string
  bed: string | null
  nurse: string | null
  device: string | null
}

interface Patient extends Omit<RawPatient, 'bed' | 'nurse' | 'device'> {
  bed?: Bed
  nurse?: Nurse
  device?: Device
}

export default function PatientListPage() {
  useAuthRedirect()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Memoized filtered patients
  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients;
    
    const term = searchTerm.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.age.toString().includes(term) ||
      p.gender.toLowerCase().includes(term) ||
      p.bed?.number?.toLowerCase().includes(term) ||
      p.nurse?.name?.toLowerCase().includes(term) ||
      p.device?.serial_number?.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const headers = getAuthHeaders()

        const [patientsRes, bedsRes, nursesRes, devicesRes] = await Promise.all([
          fetch(`${BASE_URL}/patients/`, { headers }),
          fetch(`${BASE_URL}/beds/`, { headers }),
          fetch(`${BASE_URL}/nurses/`, { headers }),
          fetch(`${BASE_URL}/devices/`, { headers }),
        ])

        if (!patientsRes.ok) throw new Error('Failed to fetch patients')
        if (!bedsRes.ok) throw new Error('Failed to fetch beds')
        if (!nursesRes.ok) throw new Error('Failed to fetch nurses')
        if (!devicesRes.ok) throw new Error('Failed to fetch devices')

        const [rawPatients, beds, nurses, devices]: [RawPatient[], Bed[], Nurse[], Device[]] =
          await Promise.all([
            patientsRes.json(),
            bedsRes.json(),
            nursesRes.json(),
            devicesRes.json(),
          ])

        const getById = <T extends { id: string }>(arr: T[], id: string | null) =>
          arr.find(item => item.id === id)

        const enrichedPatients: Patient[] = rawPatients.map(p => ({
          ...p,
          bed: getById(beds, p.bed),
          nurse: getById(nurses, p.nurse),
          device: getById(devices, p.device),
        }))

        setPatients(enrichedPatients)
      } catch (err) {
        console.error(err)
        setError('Failed to load patient data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const renderTable = () => (
    <div className="bg-white border rounded-xl overflow-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Patient</th>
            <th className="px-4 py-3 text-left">Age</th>
            <th className="px-4 py-3 text-left">Gender</th>
            <th className="px-4 py-3 text-left hidden sm:table-cell">Bed</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Nurse</th>
            <th className="px-4 py-3 text-left hidden lg:table-cell">Device</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {currentPatients.map(p => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 font-medium text-gray-900">{p.name}</td>
              <td className="px-4 py-4 text-gray-700">{p.age}</td>
              <td className="px-4 py-4">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {p.gender}
                </span>
              </td>
              <td className="px-4 py-4 hidden sm:table-cell text-gray-700">{p.bed?.number || '-'}</td>
              <td className="px-4 py-4 hidden md:table-cell text-gray-700">{p.nurse?.name || '-'}</td>
              <td className="px-4 py-4 hidden lg:table-cell text-gray-700">{p.device?.serial_number || '-'}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex gap-2 justify-end">
                  <Link
                    href={`/admin/patients/${p.id}`}
                    className="text-teal-600 hover:text-teal-800 flex items-center gap-1"
                    title="View details"
                  >
                    <Eye size={16} /> 
                    <span className="sr-only sm:not-sr-only">View</span>
                  </Link>
                  <Link
                    href={`/admin/patients/${p.id}/edit`}
                    className="text-green-600 hover:text-green-800 flex items-center gap-1"
                    title="Edit patient"
                  >
                    <Edit size={16} /> 
                    <span className="sr-only sm:not-sr-only">Edit</span>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="animate-pulse">
            <div className="h-7 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        
        <div className="bg-white border rounded-xl overflow-auto">
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="animate-spin text-teal-600 size-12" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-700">Error</h2>
          <p className="text-red-600 my-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl text-gray-700 font-bold">Patient Management</h1>
          <p className="text-gray-600">
            Showing {currentPatients.length} of {filteredPatients.length} patients
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Search patients"
            />
          </div>

          <Link
            href="/admin/patients/add"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusCircle size={18} /> 
            <span className="hidden sm:inline">Add Patient</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <Search className="mx-auto text-gray-400 size-10 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No patients found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No patients match "${searchTerm}"` 
              : 'No patients available. Add a new patient to get started.'}
          </p>
          <Link
            href="/admin/patients/add"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg transition-colors"
          >
            <PlusCircle size={16} /> Add Patient
          </Link>
        </div>
      ) : (
        <>
          {renderTable()}
          
          {/* Pagination Controls */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border rounded-md px-2 py-1 text-sm"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    totalPages - 4, 
                    currentPage - 2
                  )) + i
                  
                  return (
                    pageNum <= totalPages && (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-md text-sm ${
                          currentPage === pageNum 
                            ? 'bg-teal-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </>
      )}
    </div>
  )
}