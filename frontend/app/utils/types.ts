export type CallStatus = 'pending' | 'answered' | 'cancelled' | 'urgent' | string



export type UUID = string

// building type choices
export const BUILDING_TYPE_CHOICES = [
  ['administrator', 'Administrator'],
  ['clinical', 'Clinical'],
  ['research', 'Research'],
  ['lab', 'Laboratory'],
  ['other', 'Other'],
] as const;
export type BuildingType = typeof BUILDING_TYPE_CHOICES[number][0];

export interface User {
  id: UUID
  username: string
  email: string
  role: 'admin' | 'supervisor' | 'nurse'
}

export interface Hospitals {
  id: UUID
  name: string
  address: string
  admin: UUID | null
  phone_number: string
  speciality: string
}

export interface Building {
  id: UUID
  name: string
  hospital: UUID
  supervisor: UUID | null
  building_type: BuildingType
  floors: number | null
  address: string
  description: string
}

export interface Floor {
  id: UUID
  number: number
  building: UUID
  floor_manager: UUID | null
}

export interface Ward {
  id: UUID
  name: string
  floor: UUID
  building: UUID
}


export interface Bed {
  id: UUID
  number: string
  ward: UUID
  nurses: UUID[]
}

export interface Device {
  id: UUID
  serial_number: string
  bed: UUID
}

export interface StaffTeam {
  id: UUID
  name: string
}

export interface Nurse {
  id: UUID
  team: UUID
  nurse_id: string
  name: string
}


export interface TeamAssignment {
  id: UUID
  ward: UUID
  floor: UUID
  team: UUID
}

export interface Call {
  id: UUID
  device: UUID
  bed: UUID
  call_time: string
  status: string
  response_time: string | null
  nurse: UUID | null
}

export interface Calls {
  id: UUID
  name: string // used for dynamic routing
  status: CallStatus
  call_time: string
  response_time: string | null

  device: {
    id: UUID
    serial_number: string
  }

  bed: {
    id: UUID
    number: string
  }

  nurse: {
    id: UUID
    name: string
  } | null
}


export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bed?: {
    id: UUID
    number: string;
  };
  nurse?: {
    id: UUID
    name: string;
  };
  device?: {
    id: UUID
    serial_number: string;
  };
}

export interface ExtendedWard extends Ward {
  floor_number?: number
  building_name?: string
}

export interface Entity {
  id: string
  name?: string
  number?: number
}

export interface TeamAssignment {
  id: string
  team: string
  ward: string
  floor: string
}


