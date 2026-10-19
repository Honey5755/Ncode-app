import type { User } from '../types';

// UI-only gate, same rule as the web portal; the backend enforces it on every call.
export function can(user: User | null | undefined, screen: string, action = 'view') {
  if (user?.role === 'ADMIN') return true;
  if (user?.role === 'MANAGER') return user.permissions?.[screen]?.includes(action) ?? false;
  return false;
}
