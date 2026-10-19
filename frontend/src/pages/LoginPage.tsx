import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../services/api';

type LoginRole = 'staff' | 'admin' | 'manager';

const ROLE_COPY: Record<LoginRole, { label: string; eyebrow: string; heading: string; helper: string; expected: 'USER' | 'ADMIN' | 'MANAGER' }> = {
  staff: {
    label: 'Staff Login',
    eyebrow: 'Staff access',
    heading: 'Welcome, Field Officer',
    helper: 'Sign in to manage attendance, field visits, and tracking.',
    expected: 'USER',
  },
  admin: {
    label: 'Admin Login',
    eyebrow: 'Administrator access',
    heading: 'Welcome, Administrator',
    helper: 'Sign in to manage operations, users, and reports.',
    expected: 'ADMIN',
  },
  manager: {
    label: 'Manager Login',
    eyebrow: 'Manager access',
    heading: 'Welcome, Manager',
    helper: 'Sign in to review the areas assigned to your role.',
    expected: 'MANAGER',
  },
};

function RoleIcon({ role }: { role: LoginRole }) {
  if (role === 'admin') {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zm-3 9l2 2 4-4" /></svg>;
  }
  if (role === 'manager') {
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m8-8a4 4 0 100-8 4 4 0 000 8zm6-3a3 3 0 110-6m4 11v-2a3 3 0 00-3-3" /></svg>;
  }
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21a8 8 0 10-16 0m8-8a4 4 0 100-8 4 4 0 000 8z" /></svg>;
}

export default function LoginPage() {
  const { login, logout } = useAuth();
  const nav = useNavigate();
  // e.g. "Password changed, please log in again." after a password change signs the user out
  const notice = (useLocation().state as { message?: string } | null)?.message;
  const [loginRole, setLoginRole] = useState<LoginRole>('staff');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setBusy(true);
    setError('');
    try {
      const u = await login(identifier.trim(), password);
      if (u.role !== ROLE_COPY[loginRole].expected) {
        logout();
        throw new Error(`This account is not valid for ${ROLE_COPY[loginRole].label}.`);
      }
      nav(u.role !== 'USER' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err) || 'Authentication failed. Please verify your credentials.');
    } finally {
      setBusy(false);
    }
  };

  const directLogin = async (id: string, pass: string) => {
    setBusy(true);
    setError('');
    try {
      const u = await login(id, pass);
      nav(u.role !== 'USER' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err) || 'Authentication failed. Please verify the demo credentials.');
    } finally {
      setBusy(false);
    }
  };

  const copy = ROLE_COPY[loginRole];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/ncode_bg.jpg')`, backgroundColor: '#0a192f' }}
    >
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent md:w-2/3" />
      <div className="absolute inset-0 bg-slate-900/30" />

      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={() => setRoleMenuOpen((open) => !open)}
          aria-label="Choose login portal"
          aria-expanded={roleMenuOpen}
          title={ROLE_COPY[loginRole].label}
          className="w-11 h-11 rounded-lg bg-white/95 text-slate-700 shadow-lg flex items-center justify-center hover:bg-white"
        >
          <RoleIcon role={loginRole} />
        </button>
        {roleMenuOpen && (
          <div className="absolute right-0 mt-2 flex flex-col gap-1 rounded-lg bg-white p-1.5 shadow-xl">
            {(['staff', 'admin', 'manager'] as LoginRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setLoginRole(role);
                  setRoleMenuOpen(false);
                  setError('');
                }}
                aria-label={ROLE_COPY[role].label}
                title={ROLE_COPY[role].label}
                className={`min-w-36 h-10 rounded-md flex items-center gap-3 px-3 text-left text-sm font-semibold ${loginRole === role ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <RoleIcon role={role} />
                <span>{ROLE_COPY[role].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between z-10 gap-8">
        
        {/* Left Side: Branding */}
        <div className="text-center md:text-left flex-1 pl-0 md:pl-8 text-white relative">
          <div className="flex flex-col items-center md:items-start">
            {/* Ncode Solutions Logo Box */}
            <div className="bg-white p-3 px-4 rounded shadow-lg mb-8 inline-block">
              <span className="text-[#0088cc] font-bold text-2xl flex items-center gap-1 leading-none">
                 <span className="border-2 border-[#0088cc] rounded-full px-1.5 py-0.5 text-lg mr-1">(n)</span>
                 <div>Code<sup className="text-xs">&reg;</sup><div className="text-xs font-normal text-slate-400 mt-0.5 tracking-wide uppercase">Solutions</div></div>
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-light mb-4 text-white">
              Field Force Platform
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-md">
              Enterprise management for live attendance, tracking, and remote field operations.
            </p>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-semibold text-blue-600 mb-1">{copy.eyebrow}</p>
              <h2 className="text-3xl font-bold text-slate-800">{copy.heading}</h2>
              <p className="text-sm text-slate-500 mt-2">{copy.helper}</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Enter your username
                </label>
                <input
                  type="text"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter Login ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Enter your Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {notice && !error && (
                <div className="rounded bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-700">{notice}</div>
              )}

              {error && (
                <div className="rounded bg-red-50 border border-red-200 p-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full bg-[#0088ff] hover:bg-blue-600 text-white font-semibold py-2.5 rounded shadow-sm transition-colors"
                  disabled={busy}
                >
                  {busy ? 'Authenticating...' : 'Login'}
                </button>
                <button
                  type="button"
                  className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-2.5 rounded shadow-sm transition-colors"
                  onClick={() => {
                    setIdentifier('');
                    setPassword('');
                    setError('');
                  }}
                >
                  Reset
                </button>
                {loginRole === 'staff' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2.5 rounded shadow-sm transition-colors"
                      onClick={() => directLogin('admin', 'adminpassword123')}
                      disabled={busy}
                    >
                      Direct Login (Admin Portal)
                    </button>
                    <button
                      type="button"
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2.5 rounded shadow-sm transition-colors"
                      onClick={() => directLogin('NS00125', 'Password123!')}
                      disabled={busy}
                    >
                      Direct Login (Field Officer Portal)
                    </button>
                    <button
                      type="button"
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2.5 rounded shadow-sm transition-colors"
                      onClick={() => directLogin('manager', 'ManagerPass123!')}
                      disabled={busy}
                    >
                      Direct Login (Manager Portal)
                    </button>
                  </div>
                )}
              </div>
            </form>

            {loginRole === 'staff' && (
              <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                New employee? <Link className="text-blue-600 hover:underline" to="/register">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
