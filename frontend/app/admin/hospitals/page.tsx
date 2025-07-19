'use client'

import Link from 'next/link'
import {
  Hospital,
  PlusCircle,
  Search,
  ChevronRight,
  Pencil,
  Trash2,
  Loader
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Hospitals } from '@/app/utils/types'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"



export default function HospitalsPage() {
  useAuthRedirect()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [hospitals, setHospitals] = useState<Hospitals[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchHospitals = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('You are not logged in.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/hospitals/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch hospitals')
        }

        const data = await response.json()
        setHospitals(data)
      } catch (error) {
        console.error('Error fetching hospitals:', error)
        toast.error('Failed to load hospitals')
      } finally {
        setLoading(false)
      }
    }

    fetchHospitals()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hospital?')) {
      return
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error('You are not logged in.')
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`${API_BASE_URL}/api/hospitals/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete hospital')
      }

      setHospitals(hospitals.filter(h => h.id !== id))
      toast.success('Hospital deleted successfully')
    } catch (error) {
      console.error('Error deleting hospital:', error)
      toast.error('Failed to delete hospital')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.speciality && h.speciality.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Hospital className="text-teal-600 h-8 w-8" />
            Hospital Directory
          </h1>
          <p className="text-gray-500 mt-2">
            Manage all healthcare facilities in the system
          </p>
        </div>

        <Link
          href="/admin/hospitals/add"
          className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg hover:from-teal-700 hover:to-teal-600 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <PlusCircle className="h-5 w-5" />
          Add Hospital
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search hospitals by name, address, or specialty..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <Skeleton height={25} width={250} />
              <Skeleton height={20} width={350} className="mt-3" />
              <Skeleton height={20} width={180} className="mt-2" />
              <div className="flex justify-end mt-4 gap-2">
                <Skeleton height={35} width={80} />
                <Skeleton height={35} width={80} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Hospital className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No hospitals found</h3>
          <p className="text-gray-500 mt-2 mb-6">
            {searchTerm ? 'No matches for your search' : 'Get started by adding a new hospital'}
          </p>
          <Link
            href="/admin/hospitals/add"
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg hover:from-teal-700 hover:to-teal-600 inline-flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Add Hospital
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredHospitals.map((hospital) => (
            <li key={hospital.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="bg-teal-50 rounded-lg p-3 flex items-center justify-center">
                    <Hospital className="text-teal-600 h-10 w-10" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {hospital.name}
                      </h2>
                      {hospital.speciality && (
                        <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {hospital.speciality}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <p className="flex items-start text-gray-600">
                        <span className="font-medium w-20">Address:</span>
                        <span className="flex-1">{hospital.address}</span>
                      </p>
                      {hospital.phone_number && (
                        <p className="flex items-center text-gray-600">
                          <span className="font-medium w-20">Phone:</span>
                          <span>{hospital.phone_number}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                    <Link
                      href={`/admin/hospitals/${hospital.id}/edit`}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(hospital.id)}
                      disabled={deletingId === hospital.id}
                      className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                    >
                      {deletingId === hospital.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <Link
                    href={`/admin/hospitals/${hospital.id}`}
                    className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
                  >
                    View Details <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
