'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import {
  Pencil, Trash2, Loader2, ArrowLeft, Bed, Smartphone, Info
} from 'lucide-react'
import { Device } from '@/app/utils/types'

export default function ViewDevicePage() {
  const { id } = useParams()
  const router = useRouter()
  const [device, setDevice] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bedDetails, setBedDetails] = useState<{
    number: string;
    status: string;
    wardName: string;
    buildingName?: string;
    floorNumber?: number;
  } | null>(null)

  const fetchDeviceData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Authentication required')
        return router.push('/login')
      }

      const deviceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!deviceRes.ok) {
        if (deviceRes.status === 404) {
          setError('Device not found')
        } else if (deviceRes.status === 401) {
          setError('Session expired, please login again')
        } else {
          setError('Failed to fetch device details')
        }
        return
      }

      const deviceData: Device = await deviceRes.json()
      setDevice(deviceData)

      if (deviceData.bed) {
        const bedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/beds/${deviceData.bed}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!bedRes.ok) return setBedDetails(null)

        const bedData = await bedRes.json()
        let wardName = ''
        let buildingName = ''
        let floorNumber: number | undefined

        if (bedData.ward) {
          const wardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wards/${bedData.ward}/`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (wardRes.ok) {
            const wardData = await wardRes.json()
            wardName = wardData.name

            if (wardData.floor) {
              const floorRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/floors/${wardData.floor}/`, {
                headers: { Authorization: `Bearer ${token}` }
              })

              if (floorRes.ok) {
                const floorData = await floorRes.json()
                floorNumber = floorData.number

                if (floorData.building) {
                  const buildingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buildings/${floorData.building}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                  })

                  if (buildingRes.ok) {
                    const buildingData = await buildingRes.json()
                    buildingName = buildingData.name
                  }
                }
              }
            }
          }
        }

        setBedDetails({
          number: bedData.number,
          status: bedData.status,
          wardName,
          buildingName,
          floorNumber
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading device'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchDeviceData()
  }, [fetchDeviceData])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this device?')) return

    setIsDeleting(true)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Authentication required')
        return router.push('/login')
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/devices/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || `Delete failed with status: ${res.status}`)
      }

      toast.success('Device deleted successfully')
      router.push('/admin/devices')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting device'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const refreshData = () => {
    setBedDetails(null)
    fetchDeviceData()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-700">Loading device details...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the information</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-red-500 mt-0.5" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800">Could not load device</h3>
              <p className="mt-2 text-red-700">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => router.push('/admin/devices')}
                  className="inline-flex items-center px-3.5 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to devices
                </button>
                <button
                  onClick={refreshData}
                  className="inline-flex items-center px-3.5 py-1.5 text-sm rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  <Loader2 className="mr-1.5 h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white border rounded-xl shadow-sm p-8 text-center">
          <div className="mx-auto bg-gray-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
            <Info className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Device Not Found</h3>
          <p className="mt-2 text-gray-500">The device you're looking for doesn't exist.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/admin/devices')}
              className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to devices list
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/devices')}
            className="flex items-center text-teal-600 hover:text-teal-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to devices
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Device Details</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/admin/devices/${id}/edit`)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Device
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Device
              </>
            )}
          </button>
        </div>
      </div>

      {/* Device Details Card */}
      <div className="bg-white border rounded-xl shadow-lg overflow-hidden">
        <div className="h-15 bg-teal-500">
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Info */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="h-5 w-5 text-gray-500 mr-2" />
              Device Information
            </h2>
            <div className="space-y-4 text-gray-800">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Serial Number</h3>
                <p className="text-lg font-semibold mt-1">{device.serial_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Device ID</h3>
                <p className="font-mono text-sm mt-1">{device.id}</p>
              </div>
            </div>
          </div>

          {/* Bed Info */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bed className="h-5 w-5 text-gray-500 mr-2" />
              Bed Assignment
            </h2>
            {device.bed && bedDetails ? (
              <div className="space-y-4 text-gray-800">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Bed Number</h3>
                  <p className="text-lg font-semibold mt-1">Bed {bedDetails.number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1 flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      bedDetails.status === 'available' ? 'bg-green-500' :
                      bedDetails.status === 'occupied' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    <span className="text-sm font-medium capitalize">{bedDetails.status}</span>
                  </div>
                </div>
                {bedDetails.wardName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Ward</h3>
                    <p className="mt-1">{bedDetails.wardName}</p>
                  </div>
                )}
                {(bedDetails.floorNumber || bedDetails.buildingName) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1">
                      {bedDetails.buildingName && `${bedDetails.buildingName} `}
                      {bedDetails.floorNumber && `• Floor ${bedDetails.floorNumber}`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bed className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p>Not assigned to any bed</p>
                <button
                  onClick={() => router.push(`/admin/devices/${id}/edit`)}
                  className="mt-4 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                >
                  Assign to a bed
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t text-sm text-gray-500">
          Last updated: Just now
        </div>
      </div>

      {/* Refresh */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={refreshData}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <Loader2 className="mr-2 h-4 w-4" />
          Refresh Data
        </button>
      </div>
    </div>
  )
}
