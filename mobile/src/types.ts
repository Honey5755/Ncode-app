export type TrackingStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'LOCATION_UNAVAILABLE'
  | 'PERMISSION_DENIED'
  | 'OFFLINE'
  | 'PUNCHED_OUT';

export interface ReportsToManager {
  id: number;
  name: string;
  designation: string;
  email: string;
  phone: string;
}

export interface EmployeeProfile {
  employee_id: string;
  esic_number: string | null;
  department: string;
  designation: string;
  status: string;
  reports_to: ReportsToManager | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  is_active: boolean;
  profile?: EmployeeProfile;
  /** null for ADMIN (everything) and USER; a MANAGER's per-screen grants otherwise. */
  permissions?: Record<string, string[]> | null;
}

export type VisitType =
  | 'SITE_INSPECTION'
  | 'CLIENT_MEETING'
  | 'TECHNICAL_VERIFICATION'
  | 'INFRASTRUCTURE_AUDIT'
  | 'OTHER';

export type VisitOutcome = 'PENDING' | 'SATISFACTORY' | 'ACTION_REQUIRED' | 'FOLLOW_UP_NEEDED' | 'CANCELLED';

export interface VisitPhoto {
  id: number;
  visit: number;
  caption: string;
  latitude: number | null;
  longitude: number | null;
  captured_at: string;
  created_at: string;
  photo_url: string;
}

export interface Visit {
  id: number;
  user: number;
  session: number;
  site_name: string;
  project_name?: string;
  visit_type?: VisitType;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  end_location_name?: string;
  end_latitude?: number | null;
  end_longitude?: number | null;
  start_time: string;
  end_time: string | null;
  duration_minutes?: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  outcome?: VisitOutcome;
  notes: string;
  outcome_notes?: string;
  created_at: string;
  photos?: VisitPhoto[];
  photos_count?: number;
}

export interface Session {
  id: number;
  user: number;
  display_name: string;
  status: 'ACTIVE' | 'COMPLETED';
  tracking_status: TrackingStatus;
  punch_in_at: string;
  punch_out_at: string | null;
  duration_seconds: number;
  last_latitude: number | null;
  last_longitude: number | null;
  last_location_at: string | null;
}

export type LeaveType = 'SICK' | 'CASUAL' | 'PTO';
export interface LeaveRequest {
  id: number;
  user: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  is_mandatory: boolean;
}

export interface EmployeeNote {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocument {
  id: number;
  name: string;
  file_url: string;
  uploaded_at: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
