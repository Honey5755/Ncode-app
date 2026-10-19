import type { ScreenAction, ScreenKey, User } from '../types';

/** The one portal permission check. UI-only — the backend enforces the same rule on every call. */
export function can(user: Pick<User, 'role' | 'permissions'> | null | undefined, screen: ScreenKey, action: ScreenAction = 'view'): boolean {
  if (user?.role === 'ADMIN') return true;
  if (user?.role === 'MANAGER') return user.permissions?.[screen]?.includes(action) ?? false;
  return false;
}
