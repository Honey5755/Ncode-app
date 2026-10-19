import { can } from '../services/permissions';
import type { ScreenKey, User } from '../types';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: string; // name understood by Layout's <Icon>
  route: string;
  screen?: ScreenKey; // omitted = every portal user
}

export interface AdminNavGroup {
  id: string;
  label: string; // '' = render items without a group header
  items: AdminNavItem[];
}

/** The admin portal side menu — the single source for AdminShell and the post-login landing page. */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Command Center', icon: 'home', route: '/admin/overview', screen: 'dashboard' },
      { id: 'map', label: 'Live Map', icon: 'map', route: '/admin/map', screen: 'dashboard' },
      { id: 'visits', label: 'Field Visits', icon: 'visits', route: '/admin/visits', screen: 'attendance.visits' },
      { id: 'attendance', label: 'Attendance Records', icon: 'attendance', route: '/admin/attendance', screen: 'attendance.sessions' },
      { id: 'leaves', label: 'Leave Requests', icon: 'leaves', route: '/admin/leaves', screen: 'attendance.leaves' },
      { id: 'users', label: 'Employees & Users', icon: 'users', route: '/admin/users', screen: 'user_management.user' },
    ],
  },
  {
    id: 'setup',
    label: 'SetUp',
    items: [
      { id: 'employees', label: 'Employee', icon: 'users', route: '/admin/setup/employees', screen: 'setup.employee' },
    ],
  },
  {
    id: 'user-management',
    label: 'User Management',
    items: [
      { id: 'roles', label: 'Role', icon: 'roles', route: '/admin/user-management/roles', screen: 'user_management.role' },
      { id: 'logins', label: 'User', icon: 'users', route: '/admin/user-management/users', screen: 'user_management.user' },
      { id: 'change-password', label: 'Change Password', icon: 'key', route: '/admin/change-password' },
    ],
  },
  {
    id: 'general',
    label: '',
    items: [{ id: 'settings', label: 'Settings', icon: 'settings', route: '/admin/settings' }],
  },
];

/** Groups with only the items `user` may view (empty groups dropped). */
export const visibleNav = (user: User | null) =>
  ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.screen || can(user, i.screen)) })).filter((g) => g.items.length > 0);

/** Where `/admin` lands: the first permission-gated page the user can view, or null if their role grants nothing. */
export const firstAdminRoute = (user: User | null) =>
  ADMIN_NAV.flatMap((g) => g.items).find((i) => i.screen && can(user, i.screen))?.route ?? null;
