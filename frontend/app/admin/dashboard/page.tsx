'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Hospital, Users, Bed as BedIcon, Activity, Building2, Layers, User, Cpu, 
  Plus, ArrowRight, RefreshCw
} from 'lucide-react'
import { BASE_URL, getAuthHeaders } from '@/app/utils/api'
import useAuthRedirect from '@/app/hooks/useAuthRedirect'

export default function DashboardPage() {
  useAuthRedirect()
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [hospitals, setHospitals] = useState<number>(0)
  const [patients, setPatients] = useState<number>(0)
  const [availableBeds, setAvailableBeds] = useState<number>(0)
  const [todaysCalls, setTodaysCalls] = useState<number>(0)
  const [buildings, setBuildings] = useState<number>(0)
  const [floors, setFloors] = useState<number>(0)
  const [nurses, setNurses] = useState<number>(0)
  const [devices, setDevices] = useState<number>(0)

  // Stats Cards
  const statsCards = [
    { 
      label: 'Hospitals', 
      value: hospitals, 
      icon: <Hospital size={24} />, 
      bg: 'bg-gradient-to-br from-teal-500 to-blue-600',
      action: () => router.push('/admin/hospitals')
    },
    { 
      label: 'Patients', 
      value: patients, 
      icon: <Users size={24} />, 
      bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      action: () => router.push('/admin/patients')
    },
    { 
      label: 'Available Beds', 
      value: availableBeds, 
      icon: <BedIcon size={24} />, 
      bg: 'bg-gradient-to-br from-yellow-500 to-orange-500',
      action: () => router.push('/admin/beds')
    },
    { 
      label: "Today's Calls", 
      value: todaysCalls, 
      icon: <Activity size={24} />, 
      bg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      action: () => router.push('/admin/calls')
    },
    { 
      label: 'Buildings', 
      value: buildings, 
      icon: <Building2 size={24} />, 
      bg: 'bg-gradient-to-br from-pink-500 to-rose-500',
      action: () => router.push('/admin/buildings')
    },
    { 
      label: 'Floors', 
      value: floors, 
      icon: <Layers size={24} />, 
      bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
      action: () => router.push('/admin/floors')
    },
    { 
      label: 'Nurses', 
      value: nurses, 
      icon: <User size={24} />, 
      bg: 'bg-gradient-to-br from-lime-500 to-green-600',
      action: () => router.push('/admin/nurses')
    },
    { 
      label: 'Devices', 
      value: devices, 
      icon: <Cpu size={24} />, 
      bg: 'bg-gradient-to-br from-gray-500 to-gray-700',
      action: () => router.push('/admin/devices')
    },
  ]

  // Fetch data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return router.push('/login')
        setUsername(localStorage.getItem('username'))

        const headers = getAuthHeaders()
        const endpoints = [
          'hospitals',
          'patients',
          'beds',
          'calls',
          'buildings',
          'floors',
          'nurses',
          'devices',
        ]
        
        const responses = await Promise.all(
          endpoints.map(e => fetch(`${BASE_URL}/${e}/`, { headers }))
        )
        
        for (const res of responses) {
          if (!res.ok) throw new Error('Failed to fetch data')
        }
        
        const [
          hospData, patData, bedData, callData,
          bldData, flrData, nurData, devData,
        ] = await Promise.all(responses.map(r => r.json()))

        // Calculate today's calls
        const today = new Date();
        const todayCalls = callData.filter((c: any) => {
          const callDate = new Date(c.call_time);
          return callDate.toDateString() === today.toDateString();
        }).length;

        setHospitals(hospData.length)
        setPatients(patData.length)
        setAvailableBeds(bedData.filter((b: any) => b.status === 'available').length)
        setTodaysCalls(todayCalls)
        setBuildings(bldData.length)
        setFloors(flrData.length)
        setNurses(nurData.length)
        setDevices(devData.length)
        
      } catch (err) {
        console.error(err)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAll()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 rounded-lg p-6">
          <div className="text-red-700 font-bold mb-2">Error</div>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition"
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back{username && `, ${username}`}! Here's your system overview
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {statsCards.map(({ label, value, icon, bg, action }, index) => (
          <div 
            key={index}
            onClick={action}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all 
                       hover:shadow-xl hover:scale-[1.02] hover:cursor-pointer group"
          >
            <div className={`${bg} p-5 text-white flex justify-between items-start`}>
              <div className="bg-white/20 p-3 rounded-xl">
                {icon}
              </div>
              <button className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                  <p className="text-gray-600">{label}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      action();
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${bg.replace('bg-gradient-to-br', 'bg-gradient-to-r')}`} 
                  style={{ width: `${Math.min(100, value * 10)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center px-5 py-3 bg-white border border-gray-200 rounded-xl shadow-sm 
                     hover:bg-gray-50 hover:shadow-md transition-all"
        >
          <RefreshCw className="h-5 w-5 mr-2 text-gray-600" />
          <span className="font-medium text-gray-700">Refresh Dashboard</span>
        </button>
      </div>
    </div>
  )
}