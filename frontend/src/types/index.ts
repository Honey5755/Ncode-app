export type Role = 'USER' | 'MANAGER' | 'ADMIN';

/** Portal screens an access role can grant (mirrors backend accounts/screens.py). */
export type ScreenKey =
  | 'dashboard'
  | 'attendance.sessions'
  | 'attendance.visits'
  | 'attendance.leaves'
  | 'attendance.holidays'
  | 'setup.zone_district'
  | 'setup.taluka_village'
  | 'setup.agency'
  | 'setup.office'
  | 'setup.designation'
  | 'setup.employee'
  | 'setup.wtp_inspection'
  | 'user_management.role'
  | 'user_management.user'
  | 'user_management.admin_change_password';

export type ScreenAction = 'view' | 'add' | 'edit' | 'delete';

/** Per-screen grants; action arrays are sets (order not guaranteed). */
export type Permissions = Partial<Record<string, ScreenAction[]>>;

export type TrackingStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'LOCATION_UNAVAILABLE'
  | 'PERMISSION_DENIED'
  | 'OFFLINE'
  | 'PUNCHED_OUT';

export interface EmployeeProfile {
  employee_id: string;
  esic_number: string | null;
  department: string;
  designation: string;
  status: string;
  reports_to?: { id: number; name: string; designation: string; email: string; phone: string } | null;
  photo_url?: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: Role;
  is_active: boolean;
  profile?: EmployeeProfile;
  /** null for ADMIN (everything) and USER (no portal); a MANAGER's grants otherwise. */
  permissions?: Permissions | null;
  access_role?: { id: number; name: string; default_page: 'HOME' | 'DASHBOARD' } | null;
}

/** Row of /admin/users/ — note `access_role` is an id here, not the object /auth/me/ returns. */
export interface AdminUser extends Omit<User, 'access_role'> {
  has_active_session: boolean;
  date_joined: string;
  has_login: boolean;
  access_role: number | null;
  access_role_name: string | null;
}

export interface Opt {
  id: number;
  label: string;
}

export interface Choice {
  value: string;
  label: string;
}

/** GET /admin/options/ — every dropdown's data (active master rows only). */
export interface Options {
  companies: (Opt & { name: string })[];
  zones: Opt[];
  districts: (Opt & { zone: number | null })[];
  talukas: (Opt & { district: number | null })[];
  villages: (Opt & { taluka: number | null })[];
  agencies: (Opt & { agency_type: string; companies: number[] })[];
  offices: (Opt & { company: number; office_type: string; zone: number | null; district: number | null })[];
  designations: (Opt & { level: string })[];
  wtp_sites: (Opt & { zone: number })[];
  access_roles: Opt[];
  employees: Opt[];
  choices: Record<
    | 'status'
    | 'agency_type'
    | 'office_type'
    | 'level'
    | 'zone_district_type'
    | 'taluka_village_type'
    | 'employee_status'
    | 'default_page'
    | 'user_category',
    Choice[]
  >;
  screens: { key: ScreenKey; module: string; page: string }[];
  actions: ScreenAction[];
}

/** A row of any SetUp master / Employee / Role / User list. MasterPage handles these generically —
 *  the per-screen field lists live in its configs (pages/admin/setup/masterConfigs.tsx, UserManagementPages.tsx). */
export type MasterRow = { id?: number } & Record<string, unknown>;

export type VisitType =
  | 'SITE_INSPECTION'
  | 'CLIENT_MEETING'
  | 'TECHNICAL_VERIFICATION'
  | 'INFRASTRUCTURE_AUDIT'
  | 'OTHER';

export type VisitOutcome =
  | 'PENDING'
  | 'SATISFACTORY'
  | 'ACTION_REQUIRED'
  | 'FOLLOW_UP_NEEDED'
  | 'CANCELLED';

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
  employee_name: string;
  employee_id: string;
  department?: string;
  photos?: VisitPhoto[];
  photos_count?: number;
}

export interface Session {
  id: number;
  user: number;
  display_name: string;
  employee_id?: string;
  department?: string;
  status: 'ACTIVE' | 'COMPLETED';
  tracking_status: TrackingStatus;
  punch_in_at: string;
  punch_out_at: string | null;
  duration_seconds: number;
  interruptions: number;
  visits_count?: number;
  last_latitude: number | null;
  last_longitude: number | null;
  last_accuracy?: number | null;
  last_location_at: string | null;
}

export interface TrackingEvent {
  id: number;
  event_type: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface LocationPoint {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
}

export interface LivePoint {
  session_id: number;
  user_id: number;
  display_name: string;
  status: 'ACTIVE' | 'COMPLETED';
  tracking_status: TrackingStatus;
  latitude: number | null;
  longitude: number | null;
  last_location_at: string | null;
  punch_in_at: string;
}

export interface AdminSummary {
  total_users: number;
  active_users: number;
  currently_tracking: number;
  location_unavailable: number;
  today_punch_ins: number;
  today_punch_outs: number;
  completed_sessions: number;
  today_visits: number;
}

export interface AdminVisitDetail {
  visit: Visit;
  events: TrackingEvent[];
  employee: {
    id: number;
    name: string;
    employee_id: string;
    department: string;
    designation: string;
    email: string;
    phone: string;
  };
}

export interface Page<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export type LeaveType = 'SICK' | 'CASUAL' | 'PTO';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: number;
  user: number;
  employee_name: string;
  employee_id: string;
  department?: string;
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
