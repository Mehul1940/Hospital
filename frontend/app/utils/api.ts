// File: app/utils/api.ts

import { toast } from 'react-toastify'
import type {
  Hospitals,
  Building,
  Floor,
  Ward,
  Bed,
  Device,
  StaffTeam,
  Nurse,
  TeamAssignment,
  Call,
  Patient,
  User,
} from './types'

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    Authorization: `Bearer ${token}`,
  };
}

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// --- token helper ---
function getAuthToken(): string {
  if (typeof window === 'undefined') {
    throw new Error('Cannot access token on server side')
  }
  const token = localStorage.getItem('access_token')
  if (!token) {
    toast.error('You are not logged in')
    throw new Error('No auth token')
  }
  return token
}

// --- HTTP client ---
async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }
  const url = `${BASE}/${endpoint.replace(/^\//, '')}`
  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const text = await res.text()
    if (res.status === 401) {
      toast.error('Session expired. Redirecting to login...')
      setTimeout(() => (window.location.href = '/login'), 2000)
    }
    throw new Error(text || `API error ${res.status}`)
  }
  return (await res.json()) as T
}

// --- GET helpers ---
export const fetchHospitals      = (): Promise<Hospitals[]>     => apiClient('hospitals/')
export const fetchBuildings      = (): Promise<Building[]>      => apiClient('buildings/')
export const fetchFloors         = (): Promise<Floor[]>         => apiClient('floors/')
export const fetchWards          = (): Promise<Ward[]>          => apiClient('wards/')
export const fetchBeds           = (): Promise<Bed[]>           => apiClient('beds/')
export const fetchDevices        = (): Promise<Device[]>        => apiClient('devices/')
export const fetchStaffTeams     = (): Promise<StaffTeam[]>     => apiClient('staff-teams/')
export const fetchNurses         = (): Promise<Nurse[]>         => apiClient('nurses/')
export const fetchTeamAssignments= (): Promise<TeamAssignment[]>=> apiClient('team-assignments/')
export const fetchCalls          = (): Promise<Call[]>          => apiClient('calls/')
export const fetchPatients       = (): Promise<Patient[]>       => apiClient('patients/')
export const fetchUsers          = (): Promise<User[]>          => apiClient('users/')
export const fetchCurrentUser    = (): Promise<User>            => apiClient('users/me/')

// --- POST / PUT / DELETE ---
export const createHospital      = (data: Partial<Hospitals>)    => apiClient<Hospitals>('hospitals/', { method: 'POST', body: JSON.stringify(data) })
export const updateHospital      = (id: string, data: Partial<Hospitals>) => apiClient<Hospitals>(`hospitals/${id}/`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteHospital      = (id: string)                 => apiClient<void>(`hospitals/${id}/`,   { method: 'DELETE' })
export const deleteBuilding      = (id: string)                 => apiClient<void>(`buildings/${id}/`,   { method: 'DELETE' })
// Add to utils/api.ts
export const fetchBuilding = (id: string): Promise<Building> => 
  apiClient(`/buildings/${id}/`)

export const updateBuilding = (id: string, data: Partial<Building>): Promise<Building> => 
  apiClient(`/buildings/${id}/`, { method: 'PUT', body: JSON.stringify(data) })
