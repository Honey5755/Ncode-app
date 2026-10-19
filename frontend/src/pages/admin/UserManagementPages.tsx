import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import useOptions from '../../hooks/useOptions';
import api, { errorMessage } from '../../services/api';
import { can } from '../../services/permissions';
import type { AdminUser, Options, Permissions, ScreenAction } from '../../types';
import MasterPage, { ids, type MasterConfig, type SelectOpt } from './setup/MasterPage';

/* ---------------------------------- Role ---------------------------------- */

const MATRIX_ACTIONS: ScreenAction[] = ['add', 'edit', 'delete', 'view'];

/** Screen Functionality matrix: Module | Page | Add | Edit | Delete | View | All. */
function PermissionMatrix({ value, onChange, screens }: { value: Permissions; onChange: (p: Permissions) => void; screens: Options['screens'] }) {
  const has = (screen: string, a: ScreenAction) => !!value[screen]?.includes(a);
  const rowAll = (screen: string) => MATRIX_ACTIONS.every((a) => has(screen, a));
  const setRow = (screen: string, actions: ScreenAction[]) => {
    const next = { ...value };
    if (actions.length) next[screen] = actions;
    else delete next[screen];
    onChange(next);
  };
  const toggle = (screen: string, a: ScreenAction, on: boolean) => {
    const acts = new Set(value[screen] ?? []);
    if (on) acts.add(a).add('view'); // add/edit/delete are unusable without view (the backend adds it too)
    else if (a === 'view') acts.clear(); // no view → nothing else
    else acts.delete(a);
    setRow(screen, [...acts]);
  };
  const allOn = screens.length > 0 && screens.every((s) => rowAll(s.key));
  const box = 'accent-[#00a29a] w-4 h-4 cursor-pointer';

  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full text-left text-sm min-w-[600px]">
        <thead className="text-xs uppercase bg-[#00a29a] text-white">
          <tr>
            <th className="py-2.5 px-3">Module</th>
            <th className="px-3">Page</th>
            {MATRIX_ACTIONS.map((a) => (
              <th key={a} className="px-3 text-center">
                {a}
              </th>
            ))}
            <th className="px-3 text-center">
              <label className="inline-flex items-center gap-1.5 cursor-pointer normal-case">
                <input type="checkbox" className={box} checked={allOn} onChange={(e) => onChange(e.target.checked ? Object.fromEntries(screens.map((s) => [s.key, [...MATRIX_ACTIONS]])) : {})} />
                Select all
              </label>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {screens.map((s, i) => (
            <tr key={s.key} className="hover:bg-slate-50/50">
              <td className="py-2 px-3 text-xs font-semibold text-slate-800">{i === 0 || screens[i - 1].module !== s.module ? s.module : ''}</td>
              <td className="px-3 text-xs text-slate-700">{s.page}</td>
              {MATRIX_ACTIONS.map((a) => (
                <td key={a} className="px-3 text-center">
                  <input type="checkbox" className={box} aria-label={`${s.page}: ${a}`} checked={has(s.key, a)} onChange={(e) => toggle(s.key, a, e.target.checked)} />
                </td>
              ))}
              <td className="px-3 text-center">
                <input type="checkbox" className={box} aria-label={`${s.page}: all`} checked={rowAll(s.key)} onChange={(e) => setRow(s.key, e.target.checked ? [...MATRIX_ACTIONS] : [])} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const roleConfig: MasterConfig = {
  title: 'Role',
  module: 'User Management',
  screen: 'user_management.role',
  endpoint: '/admin/roles/',
  searchPlaceholder: 'Role name or description...',
  confirmDelete: (r) => `Delete the role "${String(r.name)}"? This cannot be undone.`,
  columns: [
    { key: 'name', label: 'Role Name' },
    { key: 'description', label: 'Description' },
    { key: 'default_page', label: 'Default Page', choice: 'default_page' },
    { key: 'user_count', label: 'Users' },
    { key: 'status', label: 'Status' },
  ],
  filters: [{ name: 'status', label: 'Status', options: (o) => o.choices.status }],
  fields: [
    { name: 'name', label: 'Role Name', required: true },
    { name: 'description', label: 'Description' },
    { name: 'default_page', label: 'Default Page', type: 'choice', required: true, options: (o) => o.choices.default_page },
    { name: 'status', label: 'Status', type: 'choice', required: true, options: (o) => o.choices.status },
    // Stored now; they only take effect in later phases.
    { name: 'complaint_summary_dashboard', label: 'Complaint Summary Dashboard', type: 'checkbox' },
    { name: 'statistic_dashboard', label: 'Statistic Dashboard', type: 'checkbox' },
    { name: 'citizen_opinion', label: 'Citizen Opinion', type: 'checkbox' },
    { name: 'download_android_apk', label: 'Download Android APK', type: 'checkbox' },
    {
      name: 'permissions',
      label: 'Screen Functionality',
      wide: true,
      hint: 'Ticking Add, Edit or Delete also grants View.',
      render: (v, set, o) => <PermissionMatrix value={(v as Permissions) ?? {}} onChange={set} screens={o.screens} />,
    },
  ],
  defaults: {
    status: 'ACTIVE',
    default_page: 'HOME',
    permissions: {},
    complaint_summary_dashboard: false,
    statistic_dashboard: false,
    citizen_opinion: false,
    download_android_apk: false,
  },
};

export function RolesPage() {
  return <MasterPage config={roleConfig} />;
}

/* ------------------------------ User (logins) ------------------------------ */

const yesNo = (yes: string, no: string): SelectOpt[] => [
  { value: '1', label: yes },
  { value: '0', label: no },
];

const employeeLabel = (u: AdminUser) => `${u.full_name} (${u.profile?.employee_id ?? u.username})`;
const prefillFrom = (u?: AdminUser) => (u ? { username: u.username, email: u.email, phone: u.phone } : {});

export function UsersPage() {
  const [params] = useSearchParams();
  const preselect = Number(params.get('employee')) || null; // from Employee list → "No login · Create"
  const [noLogin, setNoLogin] = useState<AdminUser[] | null>(null);

  const loadNoLogin = () =>
    api
      .get<AdminUser[]>('/admin/users/', { params: { has_login: 0, no_page: 1 } })
      .then((r) => setNoLogin(r.data))
      .catch(() => setNoLogin([]));
  useEffect(() => {
    loadNoLogin();
  }, []);

  const config = useMemo<MasterConfig>(
    () => ({
      title: 'User',
      module: 'User Management',
      screen: 'user_management.user',
      endpoint: '/admin/users/',
      searchPlaceholder: 'Username, name, employee code, mobile...',
      noDelete: true, // deactivate via the Active flag so attendance history stays intact
      columns: [
        { key: 'username', label: 'Username' },
        { key: 'full_name', label: 'Name' },
        { key: 'employee_code', label: 'Employee Code', render: (r) => (r.profile as AdminUser['profile'])?.employee_id ?? '—' },
        { key: 'role', label: 'User Category', choice: 'user_category' },
        { key: 'access_role_name', label: 'Role Name' },
        { key: 'phone', label: 'Mobile' },
        {
          key: 'has_login',
          label: 'Login',
          render: (r) => <span className={`badge ${r.has_login ? 'badge-success' : 'badge-warning'}`}>{r.has_login ? 'Login' : 'No login'}</span>,
        },
        {
          key: 'is_active',
          label: 'Status',
          render: (r) => <span className={`badge ${r.is_active ? 'badge-success' : 'badge-danger'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>,
        },
      ],
      filters: [
        { name: 'role', label: 'User Category', options: (o) => o.choices.user_category },
        { name: 'access_role', label: 'Role Name', options: (o) => ids(o.access_roles) },
        { name: 'is_active', label: 'Status', options: () => yesNo('Active', 'Inactive') },
        { name: 'has_login', label: 'Login', options: () => yesNo('Has login', 'No login') },
        { name: 'active', label: 'Shift', options: () => yesNo('In field now', 'Off shift') },
      ],
      fields: [
        {
          name: 'employee',
          label: 'Employee',
          type: 'select',
          required: true,
          show: (f) => !f.id,
          hint: 'Employees without a login (add them under SetUp → Employee).',
          options: () => (noLogin ?? []).map((u) => ({ value: u.id, label: employeeLabel(u) })),
          onChange: (v) => prefillFrom(noLogin?.find((u) => u.id === v)),
        },
        { name: 'username', label: 'Username', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true, show: (f) => !f.id, hint: 'At least 8 characters; not too common, entirely numeric or similar to the username.' },
        { name: 'first_name', label: 'First Name', show: (f) => !!f.id },
        { name: 'last_name', label: 'Last Name', show: (f) => !!f.id },
        {
          name: 'role',
          label: 'User Category',
          type: 'choice',
          required: true,
          options: (o) => o.choices.user_category,
          onChange: (v) => (v === 'MANAGER' ? {} : { access_role: null }),
        },
        {
          name: 'access_role',
          label: 'Role Name',
          type: 'select',
          options: (o) => ids(o.access_roles),
          disabled: (f) => f.role !== 'MANAGER',
          hint: 'Managers only — decides which portal screens they can use. Field Staff use the mobile app.',
        },
        { name: 'phone', label: 'Mobile' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'is_active', label: 'Active (can sign in)', type: 'checkbox' },
      ],
      defaults: { role: 'USER', is_active: true },
    }),
    [noLogin],
  );

  // A preselected employee needs the no-login list before the form can prefill.
  if (preselect && !noLogin) return <Layout title="User">{null}</Layout>;
  return (
    <MasterPage
      config={config}
      initialForm={preselect ? { employee: preselect, ...prefillFrom(noLogin?.find((u) => u.id === preselect)) } : undefined}
      onSaved={loadNoLogin}
    />
  );
}

/* ----------------------------- Password pages ----------------------------- */

const pwInput = {
  type: 'password',
  className: 'input',
  required: true,
  minLength: 8,
  pattern: '.*\\D.*',
  title: 'At least 8 characters and not entirely numeric',
  autoComplete: 'new-password',
} as const;

/** Shared card shell: title strip, mandatory note, messages, Submit/Reset. */
function PasswordCard({
  title,
  intro,
  busy,
  disabled,
  message,
  onSubmit,
  onReset,
  children,
}: {
  title: string;
  intro: string;
  busy: boolean;
  disabled?: boolean;
  message: { ok: boolean; text: string } | null;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="card space-y-4 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{intro}</p>
        </div>
        <p className="text-[11px] font-semibold text-rose-600 shrink-0">All fields marked * are mandatory</p>
      </div>
      {message && (
        <div className={`rounded-lg border p-3 text-sm whitespace-pre-line ${message.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {message.text}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Reset
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy || disabled}>
          {busy ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}

const Req = ({ htmlFor, children }: { htmlFor: string; children: ReactNode }) => (
  <label htmlFor={htmlFor} className="label">
    {children}
    <span className="text-rose-600"> *</span>
  </label>
);

function passwordError(e: unknown) {
  return errorMessage(e).replace(/^(new_password|old_password|password|non_field_errors): /gm, '');
}

export function AdminChangePasswordPage() {
  const { user } = useAuth();
  const { options } = useOptions();
  const canEdit = can(user, 'user_management.admin_change_password', 'edit');
  const canListUsers = can(user, 'user_management.user');
  const [logins, setLogins] = useState<SelectOpt[] | null>(null);
  const [form, setForm] = useState({ user: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!canListUsers) return;
    api
      .get<AdminUser[]>('/admin/users/', { params: { has_login: 1, no_page: 1 } })
      .then((r) => setLogins(r.data.map((u) => ({ value: u.id, label: `${employeeLabel(u)} · ${u.username}` }))))
      .catch(() => setLogins(null));
  }, [canListUsers]);

  // Without access to the User list, fall back to the shared employee options.
  const choices = logins ?? (options ? ids(options.employees) : []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.password !== form.confirm) return setMessage({ ok: false, text: 'New password and confirm password do not match.' });
    setBusy(true);
    try {
      const r = await api.post<{ detail: string }>(`/admin/users/${form.user}/set-password/`, { new_password: form.password });
      setMessage({ ok: true, text: `${r.data.detail} Their other sessions have been signed out.` });
      setForm({ user: '', password: '', confirm: '' });
    } catch (err) {
      setMessage({ ok: false, text: passwordError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Admin Change Password" subtitle="User Management · Admin Change Password">
      <PasswordCard
        title="Admin Change Password"
        intro="Set a new password for an employee's login. They will have to sign in again."
        busy={busy}
        disabled={!canEdit}
        message={message ?? (canEdit ? null : { ok: false, text: 'Your role can view this page but not change passwords.' })}
        onSubmit={submit}
        onReset={() => {
          setForm({ user: '', password: '', confirm: '' });
          setMessage(null);
        }}
      >
        <div className="md:col-span-2">
          <Req htmlFor="acp-user">Employee</Req>
          <select id="acp-user" className="input" required value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })}>
            <option value="">-- Select --</option>
            {choices.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Req htmlFor="acp-new">New Password</Req>
          <input id="acp-new" {...pwInput} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <Req htmlFor="acp-confirm">Confirm Password</Req>
          <input id="acp-confirm" {...pwInput} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
      </PasswordCard>
    </Layout>
  );
}

export function ChangePasswordPage() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const empty = { old: '', password: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.password !== form.confirm) return setMessage({ ok: false, text: 'New password and confirm password do not match.' });
    setBusy(true);
    try {
      await api.post('/auth/change-password/', { old_password: form.old, new_password: form.password });
      // The backend revoked every refresh token of this user, so start over at the login screen.
      logout();
      nav('/login', { replace: true, state: { message: 'Password changed, please log in again.' } });
    } catch (err) {
      setMessage({ ok: false, text: passwordError(err) });
      setBusy(false);
    }
  };

  return (
    <Layout title="Change Password" subtitle="User Management · Change Password">
      <PasswordCard
        title="Change Password"
        intro="After changing your password you will be signed out everywhere and asked to log in again."
        busy={busy}
        message={message}
        onSubmit={submit}
        onReset={() => {
          setForm(empty);
          setMessage(null);
        }}
      >
        <div className="md:col-span-2">
          <Req htmlFor="cp-old">Current Password</Req>
          <input id="cp-old" type="password" className="input" required autoComplete="current-password" value={form.old} onChange={(e) => setForm({ ...form, old: e.target.value })} />
        </div>
        <div>
          <Req htmlFor="cp-new">New Password</Req>
          <input id="cp-new" {...pwInput} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <Req htmlFor="cp-confirm">Confirm Password</Req>
          <input id="cp-confirm" {...pwInput} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
      </PasswordCard>
    </Layout>
  );
}
