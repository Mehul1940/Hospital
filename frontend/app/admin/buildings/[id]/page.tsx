'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Building, Hospitals, User } from '@/app/utils/types'
import { toast } from 'react-toastify'
import { 
  ChevronLeft, 
  Building2, 
  MapPin, 
  Layers, 
  User as UserIcon, 
  Hospital as HospitalIcon,
  Pencil,
  Trash2,
  Loader
} from 'lucide-react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export default function BuildingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [building, setBuilding] = useState<Building | null>(null)
  const [hospital, setHospital] = useState<Hospitals | null>(null)
  const [supervisor, setSupervisor] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token') || ''
      try {
        setLoading(true)
        
        // Fetch building data
        const res = await fetch(`${API_BASE}/buildings/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch building')
        const data: Building = await res.json()
        setBuilding(data)

        // Fetch hospital
        if (data.hospital) {
          const hospitalRes = await fetch(`${API_BASE}/hospitals/${data.hospital}/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (hospitalRes.ok) {
            const hospitalData: Hospitals = await hospitalRes.json()
            setHospital(hospitalData)
          }
        }

        // Fetch supervisor
        if (data.supervisor) {
          const supRes = await fetch(`${API_BASE}/api/users/${data.supervisor}/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (supRes.ok) {
            const supData: User = await supRes.json()
            setSupervisor(supData)
          }
        }

      } catch (err) {
        console.error(err)
        toast.error('Failed to load building details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this building? All associated data will be removed.')) return
    
    setDeleting(true)
    const token = localStorage.getItem('access_token') || ''
    try {
      const res = await fetch(`${API_BASE}/buildings/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) throw new Error('Delete failed')
      
      toast.success('Building deleted successfully!')
      router.push('/admin/buildings')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete building')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 pt-4">
            <div className="h-12 bg-gray-200 rounded w-32"></div>
            <div className="h-12 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!building) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Building Not Found</h2>
        <p className="text-gray-600 mb-6">
          The building you're looking for doesn't exist or may have been removed.
        </p>
        <button
          onClick={() => router.push('/admin/buildings')}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Back to Buildings
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => router.push('/admin/buildings')}
          className="flex items-center text-teal-600 hover:text-teal-800 font-medium mb-4"
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Buildings
        </button>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-teal-100 p-3 rounded-lg">
              <Building2 className="text-teal-600 h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {building.name}
              </h1>
              <p className="text-gray-600 mt-1 capitalize">
                {building.building_type} Building
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/admin/buildings/${id}/edit`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 flex items-center gap-2 disabled:opacity-70"
            >
              {deleting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Building Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Building Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Building Name</span>
                </div>
                <p className="text-gray-800">{building.name}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-medium">Building Type</span>
                </div>
                <p className="text-gray-800 capitalize">{building.building_type}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-medium">Number of Floors</span>
                </div>
                <p className="text-gray-800">{building.floors ?? 'Not specified'}</p>
              </div>
              
              {building.address && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Address</span>
                  </div>
                  <p className="text-gray-800">{building.address}</p>
                </div>
              )}
              
              {building.description && (
                <div className="md:col-span-2">
                  <div className="text-sm font-medium text-gray-500 mb-1">Description</div>
                  <p className="text-gray-800">{building.description}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Structure Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Building Structure</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Layers className="text-blue-600 h-8 w-8" />
                </div>
                <h3 className="font-medium text-gray-800">Floors</h3>
                <p className="text-gray-600">Manage building floors</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800">Wards</h3>
                <p className="text-gray-600">Manage building wards</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                <div className="bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-800">Rooms</h3>
                <p className="text-gray-600">Manage building rooms</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Related Information */}
        <div className="space-y-6">
          {/* Hospital Information */}
          {hospital && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <HospitalIcon className="h-5 w-5 text-teal-600" /> Hospital Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Hospital Name</div>
                  <p className="text-gray-800">{hospital.name}</p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Hospital Address</div>
                  <p className="text-gray-800">{hospital.address}</p>
                </div>
                
                {hospital.speciality && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Speciality</div>
                    <p className="text-gray-800">{hospital.speciality}</p>
                  </div>
                )}
                
                {hospital.phone_number && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Phone</div>
                    <p className="text-gray-800">{hospital.phone_number}</p>
                  </div>
                )}
                
                <Link
                  href={`/admin/hospitals/${hospital.id}`}
                  className="inline-flex items-center text-teal-600 hover:text-teal-800 font-medium mt-2"
                >
                  View Hospital Details <ChevronLeft className="ml-1 transform rotate-180 h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Supervisor Information */}
          {supervisor && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-teal-600" /> Supervisor Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Name</div>
                  <p className="text-gray-800">
                    {supervisor.username}
                  </p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                  <p className="text-gray-800">{supervisor.email}</p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Role</div>
                  <p className="text-gray-800 capitalize">{supervisor.role}</p>
                </div>
                
                {supervisor.username && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Username</div>
                    <p className="text-gray-800">{supervisor.username}</p>
                  </div>
                )}
                
                <Link
                  href={`/admin/users/${supervisor.id}`}
                  className="inline-flex items-center text-teal-600 hover:text-teal-800 font-medium mt-2"
                >
                  View User Details <ChevronLeft className="ml-1 transform rotate-180 h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}