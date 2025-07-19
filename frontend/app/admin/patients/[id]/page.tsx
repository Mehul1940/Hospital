'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BASE_URL, getAuthHeaders } from '@/app/utils/api'
import { Patient, Bed, Nurse, Device } from '@/app/utils/types'

export default function ViewPatientPage() {
  const { id } = useParams()
  const router = useRouter()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [bed, setBed] = useState<Bed | null>(null)
  const [nurse, setNurse] = useState<Nurse | null>(null)
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientRes = await fetch(`${BASE_URL}/patients/${id}/`, {
          headers: getAuthHeaders(),
        })

        if (!patientRes.ok) {
          throw new Error(`Patient fetch failed (${patientRes.status})`)
        }

        const patientData: Patient = await patientRes.json()
        setPatient(patientData)

        // Parallel fetching for related entities
        const fetches = []

        if (patientData.bed) {
          fetches.push(
            fetch(`${BASE_URL}/beds/${patientData.bed}/`, {
              headers: getAuthHeaders(),
            }).then(res => res.json()).then(setBed)
          )
        }

        if (patientData.nurse) {
          fetches.push(
            fetch(`${BASE_URL}/nurses/${patientData.nurse}/`, {
              headers: getAuthHeaders(),
            }).then(res => res.json()).then(setNurse)
          )
        }

        if (patientData.device) {
          fetches.push(
            fetch(`${BASE_URL}/devices/${patientData.device}/`, {
              headers: getAuthHeaders(),
            }).then(res => res.json()).then(setDevice)
          )
        }

        await Promise.all(fetches)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleDelete = async () => {
    setShowDeleteModal(false)
    try {
      setIsDeleting(true)
      const response = await fetch(`${BASE_URL}/patients/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to delete patient (${response.status})`)
      }

      router.push('/admin/patients')
    } catch (err) {
      console.error('Delete error:', err)
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const renderDetail = (label: string, value: string | number | undefined) => (
    <div className="py-2 border-b border-gray-200">
      <dt className="font-medium text-gray-700">{label}</dt>
      <dd className="mt-1 text-gray-900">{value ?? '-'}</dd>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
        <p>Loading patient data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto bg-red-50 rounded-lg">
        <div className="text-red-700 font-bold mb-2">Error</div>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
        >
          &larr; Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <span className="font-semibold">{patient?.name}</span>?
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border text-gray-700 rounded hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 text-white rounded transition ${
                    isDeleting 
                      ? 'bg-red-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patient Details</h1>
        <button
          onClick={() => router.back()}
          className="flex items-center text-teal-600 hover:text-teal-800 transition"
        >
          &larr; Back to list
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <dl className="divide-y divide-gray-200">
            {renderDetail("Full Name", patient?.name)}
            {renderDetail("Age", patient?.age)}
            {renderDetail("Gender", patient?.gender)}
            {renderDetail("Bed Number", bed?.number)}
            {renderDetail("Assigned Nurse", nurse?.name)}
            {renderDetail("Device Serial", device?.serial_number)}
          </dl>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => router.push(`/admin/patients/${id}/edit`)}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition"
          >
            Edit Patient
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition ${
              isDeleting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            Delete Patient
          </button>
        </div>
      </div>
    </div>
  )
}