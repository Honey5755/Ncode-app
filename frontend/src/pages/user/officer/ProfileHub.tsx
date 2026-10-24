import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import api, { errorMessage } from '../../../services/api';
import { fmtDate, fmtTime } from '../../../services/format';
import type { Holiday, LeaveRequest, Session } from '../../../types';
import { Lang, setLang, useT } from './i18n';

type Page = 'holidays' | 'notes' | 'documents' | 'hr' | 'announcements' | 'language' | 'password' | 'reminder' | null;

const ANNUAL_LEAVE_DAYS = 40; // ponytail: fixed quota, no backend policy yet; add a quota field when HR policy exists
const REMINDER_KEY = 'ncode_punch_reminder';

// ponytail: static sample items; replace with a backend feed when announcements exist
const ANNOUNCEMENTS = [
  { id: 1, title: 'Attendance policy v1.0', body: 'Punch in with a selfie and GPS lock at the start of every field shift.', date: '2026-10-01' },
  { id: 2, title: 'Festival holiday list published', body: 'Check the Holiday List for the gazetted dates this quarter.', date: '2026-10-10' },
  { id: 3, title: 'App update', body: 'New Language and Punch Reminder settings are available in Profile.', date: '2026-10-18' },
];

const initials = (n: string) => {
  const p = n.trim().split(/\s+/).filter(Boolean);
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : (p[0] ?? '?').slice(0, 2)).toUpperCase();
};

function Row({ icon, title, sub, onClick, badge, danger }: { icon: ReactNode; title: string; sub: string; onClick: () => void; badge?: string; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white border text-left shadow-sm hover:shadow-md transition ${danger ? 'border-rose-100' : 'border-slate-100'}`}>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${danger ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-bold truncate ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{title}</span>
        <span className={`block text-[11px] truncate ${danger ? 'text-rose-400' : 'text-slate-400'}`}>{sub}</span>
      </span>
      {badge && <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-rose-500 text-white shrink-0">{badge}</span>}
    </button>
  );
}

const Section = ({ title, children, cols = 2 }: { title: string; children: ReactNode; cols?: 1 | 2 }) => (
  <section className="space-y-2">
    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">{title}</h3>
    <div className={`grid gap-2.5 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>{children}</div>
  </section>
);

function SubPage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100">‹</button>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Holidays() {
  const [rows, setRows] = useState<Holiday[]>([]);
  useEffect(() => {
    api.get('/attendance/holidays/').then((r) => setRows(Array.isArray(r.data) ? r.data : r.data?.results ?? [])).catch(() => {});
  }, []);
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No holidays published yet.</p>}
      {rows.map((h) => (
        <div key={h.id} className="flex justify-between p-3 rounded-xl bg-white border border-slate-100 text-sm">
          <span className="font-semibold text-slate-700">{h.name}{h.is_mandatory && <span className="text-[10px] text-slate-400 ml-1.5">(Mandatory)</span>}</span>
          <span className="font-mono text-slate-500">{fmtDate(h.date)}</span>
        </div>
      ))}
    </div>
  );
}

function Notes() {
  const [rows, setRows] = useState<{ id: number; content: string; created_at: string }[]>([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const load = useCallback(() => api.get('/attendance/notes/').then((r) => setRows(Array.isArray(r.data) ? r.data : r.data?.results ?? [])).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try { await api.post('/attendance/notes/', { content: text.trim() }); setText(''); setErr(''); load(); } catch (x) { setErr(errorMessage(x)); }
  };
  return (
    <div className="space-y-3">
      <form onSubmit={add} className="space-y-2">
        <textarea className="input min-h-[80px]" placeholder="Write a personal memo…" value={text} onChange={(e) => setText(e.target.value)} />
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <button className="btn btn-primary w-full" type="submit">Add note</button>
      </form>
      {rows.map((n) => (
        <div key={n.id} className="p-3 rounded-xl bg-white border border-slate-100 text-sm">
          <p className="whitespace-pre-wrap text-slate-700">{n.content}</p>
          <div className="flex justify-between mt-2 text-[11px] text-slate-400">
            <span>{fmtDate(n.created_at)} {fmtTime(n.created_at)}</span>
            <button type="button" className="text-rose-500 font-semibold" onClick={() => api.delete(`/attendance/notes/${n.id}/`).then(load)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Documents() {
  const [rows, setRows] = useState<{ id: number; name: string; uploaded_at: string }[]>([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.get('/attendance/documents/').then((r) => setRows(Array.isArray(r.data) ? r.data : r.data?.results ?? [])).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return setErr('Enter a name and choose a file.');
    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('file', file);
    try { await api.post('/attendance/documents/', fd); setName(''); setFile(null); setErr(''); load(); } catch (x) { setErr(errorMessage(x)); }
  };
  const download = async (id: number, n: string) => {
    const r = await api.get(`/attendance/documents/${id}/download/`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.data);
    a.download = n;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-3">
      <form onSubmit={upload} className="p-3 rounded-xl bg-white border border-dashed border-slate-300 space-y-2">
        <input className="input" placeholder="Document name (e.g. PAN)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="file" className="text-xs w-full" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {err && <p className="text-xs text-rose-600">{err}</p>}
        <button className="btn btn-primary w-full" type="submit">Upload</button>
      </form>
      {rows.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No documents uploaded.</p>}
      {rows.map((d) => (
        <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 text-sm">
          <span className="font-semibold text-slate-700 truncate">{d.name}</span>
          <span className="flex gap-3 shrink-0 text-xs font-semibold">
            <button type="button" className="text-blue-600" onClick={() => download(d.id, d.name)}>Download</button>
            <button type="button" className="text-rose-500" onClick={() => api.delete(`/attendance/documents/${d.id}/`).then(load)}>Delete</button>
          </span>
        </div>
      ))}
    </div>
  );
}

function PasswordForm() {
  const [f, setF] = useState({ old: '', next: '', again: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (f.next !== f.again) return setMsg({ ok: false, text: 'New passwords do not match.' });
    try {
      await api.post('/auth/change-password/', { old_password: f.old, new_password: f.next });
      setF({ old: '', next: '', again: '' });
      setMsg({ ok: true, text: 'Password changed.' });
    } catch (x) { setMsg({ ok: false, text: errorMessage(x) }); }
  };
  const set = (k: 'old' | 'next' | 'again') => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={submit} className="space-y-3 p-4 rounded-xl bg-white border border-slate-100">
      <input type="password" className="input" placeholder="Current password" value={f.old} onChange={set('old')} required />
      <input type="password" className="input" placeholder="New password" value={f.next} onChange={set('next')} required />
      <input type="password" className="input" placeholder="Confirm new password" value={f.again} onChange={set('again')} required />
      {msg && <p className={`text-xs ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}
      <button className="btn btn-primary w-full" type="submit">Change password</button>
    </form>
  );
}

function Reminder() {
  const [on, setOn] = useState(() => { try { return JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}').on ?? false; } catch { return false; } });
  const [time, setTime] = useState(() => { try { return JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}').time ?? '09:00'; } catch { return '09:00'; } });
  const [note, setNote] = useState('');
  const save = async () => {
    localStorage.setItem(REMINDER_KEY, JSON.stringify({ on, time }));
    if (on && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    setNote('Saved. The reminder shows while this page is open.');
  };
  return (
    <div className="space-y-3 p-4 rounded-xl bg-white border border-slate-100">
      <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
        Remind me to punch in
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="w-5 h-5 accent-emerald-500" />
      </label>
      <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} disabled={!on} />
      <button className="btn btn-primary w-full" onClick={save}>Save</button>
      {note && <p className="text-xs text-slate-500">{note}</p>}
    </div>
  );
}

/** Fires the saved punch reminder while the staff portal is open. ponytail: tab must be open; real push needs a service worker + backend. */
export function usePunchReminder(onDuty: boolean) {
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const { on, time } = JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}');
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const key = `ncode_reminded_${now.toDateString()}`;
        if (on && hhmm === time && !onDuty && !localStorage.getItem(key)) {
          localStorage.setItem(key, '1');
          if ('Notification' in window && Notification.permission === 'granted') new Notification('Time to punch in', { body: 'Open Ncode Field to start your shift.' });
          else alert('Time to punch in');
        }
      } catch { /* ignore */ }
    }, 20000);
    return () => clearInterval(id);
  }, [onDuty]);
}

export default function ProfileHub({ history, onOpenLeave, onGoTab }: { history: Session[]; onOpenLeave: () => void; onGoTab: (tab: string) => void }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { t, lang } = useT();
  const [page, setPage] = useState<Page>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  useEffect(() => { api.get('/attendance/leaves/').then((r) => setLeaves(Array.isArray(r.data) ? r.data : r.data?.results ?? [])).catch(() => {}); }, []);

  const name = user?.full_name || user?.username || '';
  const p = user?.profile;
  const now = new Date();
  const monthDays = new Set(history.filter((s) => { const d = new Date(s.punch_in_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).map((s) => new Date(s.punch_in_at).toDateString())).size;
  const usedDays = leaves.filter((l) => l.status === 'APPROVED').reduce((n, l) => n + Math.round((+new Date(l.end_date) - +new Date(l.start_date)) / 864e5) + 1, 0);
  const last = history[0] ?? null;
  const back = () => setPage(null);

  if (page) {
    const titles: Record<Exclude<Page, null>, string> = {
      holidays: t('holidayList'), notes: t('notes'), documents: t('myDocuments'), hr: t('hrProfile'),
      announcements: t('announcements'), language: t('language'), password: t('password'), reminder: t('punchReminder'),
    };
    return (
      <SubPage title={titles[page]} onBack={back}>
        {page === 'holidays' && <Holidays />}
        {page === 'notes' && <Notes />}
        {page === 'documents' && <Documents />}
        {page === 'password' && <PasswordForm />}
        {page === 'reminder' && <Reminder />}
        {page === 'hr' && (
          <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-100 text-sm">
            {([['Employee ID', p?.employee_id], ['Designation', p?.designation], ['Department', p?.department], ['ESIC Number', p?.esic_number], ['Email', user?.email], ['Phone', user?.phone], ['System Role', user?.role]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between p-3"><span className="text-slate-500">{k}</span><span className="font-semibold text-slate-800">{v || '—'}</span></div>
            ))}
          </div>
        )}
        {page === 'announcements' && ANNOUNCEMENTS.map((a) => (
          <div key={a.id} className="p-3 rounded-xl bg-white border border-slate-100">
            <div className="flex justify-between"><span className="font-bold text-sm text-slate-800">{a.title}</span><span className="text-[11px] text-slate-400">{fmtDate(a.date)}</span></div>
            <p className="text-xs text-slate-500 mt-1">{a.body}</p>
          </div>
        ))}
        {page === 'language' && (
          <>
            <div className="rounded-xl bg-white border border-slate-100 divide-y divide-slate-100">
              {([['en', 'English', 'Standard business English'], ['hi', 'हिंदी', 'राजभाषा हिंदी'], ['gu', 'ગુજરાતી', 'સ્થાનિક ભાષા ગુજરાતી']] as [Lang, string, string][]).map(([code, label, sub]) => (
                <button key={code} type="button" onClick={() => setLang(code)} className={`w-full flex items-center justify-between p-4 text-left ${lang === code ? 'bg-emerald-50' : ''}`}>
                  <span><span className="block font-bold text-slate-800">{label}</span><span className="text-xs text-slate-500">{sub}</span></span>
                  {lang === code && <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">✓</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-100">Menus and headings adapt to your selected language. Form content stays in English.</p>
          </>
        )}
      </SubPage>
    );
  }

  const ic = (c: string) => <span aria-hidden>{c}</span>;
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-extrabold flex items-center justify-center ring-4 ring-emerald-100 shrink-0">{initials(name)}</div>
        <div className="min-w-0 text-sm">
          <p className="text-lg font-extrabold text-slate-900 truncate">{name}</p>
          <p className="text-emerald-600 font-bold">{p?.designation || 'Field Officer'}</p>
          <p className="text-xs text-slate-500 font-mono">ID: {p?.employee_id || user?.username}</p>
          <p className="text-xs text-slate-500 truncate">{p?.department || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center">
        {[
          [t('thisMonth'), String(monthDays), t('daysPresent'), 'text-emerald-600'],
          [t('leaveBalance'), String(Math.max(0, ANNUAL_LEAVE_DAYS - usedDays)), t('daysAvailable'), 'text-amber-600'],
          [t('lastPunch'), last ? fmtDate(last.punch_in_at) : t('none'), last ? fmtTime(last.punch_in_at) : '', 'text-slate-800'],
        ].map(([label, val, cap, color]) => (
          <div key={label} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`text-xl font-extrabold my-1 ${color}`}>{val}</p>
            <p className="text-[10px] text-slate-500">{cap}</p>
          </div>
        ))}
      </div>

      <Section title={t('myWork')}>
        <Row icon={ic('🗓')} title={t('viewAttendance')} sub="Calendar & logs" onClick={() => onGoTab('history')} />
        <Row icon={ic('📝')} title={t('requestLeave')} sub="Apply & balance" onClick={onOpenLeave} />
        <Row icon={ic('🎉')} title={t('holidayList')} sub="Gazetted dates" onClick={() => setPage('holidays')} />
        <Row icon={ic('🗒')} title={t('notes')} sub="Personal memos" onClick={() => setPage('notes')} />
        <Row icon={ic('🧭')} title={t('myRoute')} sub="GPS trail & map" onClick={() => onGoTab('route')} />
      </Section>
      <Section title={t('myHr')}>
        <Row icon={ic('🪪')} title={t('hrProfile')} sub="Official records" onClick={() => setPage('hr')} />
        <Row icon={ic('📁')} title={t('myDocuments')} sub="Vault & files" onClick={() => setPage('documents')} />
      </Section>
      <Section title={t('updates')} cols={1}>
        <Row icon={ic('🔔')} title={t('announcements')} sub="Official bulletins & updates" badge={`${ANNOUNCEMENTS.length} NEW`} onClick={() => setPage('announcements')} />
      </Section>
      <Section title={t('account')}>
        <Row icon={ic('🔑')} title={t('password')} sub="Change login key" onClick={() => setPage('password')} />
        <Row icon={ic('🌐')} title={t('language')} sub="EN / HI / GJ" onClick={() => setPage('language')} />
        <Row icon={ic('⏰')} title={t('punchReminder')} sub="Notification alert" onClick={() => setPage('reminder')} />
        <Row danger icon={ic('⎋')} title={t('logout')} sub="Exit application" onClick={() => { if (confirm('Are you sure you want to log out?')) { logout(); nav('/login', { replace: true }); } }} />
      </Section>
    </div>
  );
}
