import { ChangeEvent, useState } from 'react';
import LiveCamera from '../../../components/LiveCamera';
import api, { errorMessage } from '../../../services/api';
import { fmtDate, fmtDuration, fmtTime } from '../../../services/format';
import type { Session, TrackingEvent } from '../../../types';
import { useT } from './i18n';

type Gps = { status: 'idle' | 'busy' | 'ok' | 'fail'; text?: string };

const Step = ({ n, title, right, children }: { n: number; title: string; right?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center">{n}</span>
        <span className="text-sm font-bold text-slate-800">{title}</span>
      </div>
      {right}
    </div>
    {children}
  </div>
);

export default function AttendanceTab({
  session, history, events, busy, onPunchIn, onPunchOut, onGoHistory,
}: {
  session: Session | null;
  history: Session[];
  events: TrackingEvent[];
  busy: boolean;
  onPunchIn: (file: File) => void;
  onPunchOut: () => void;
  onGoHistory: () => void;
}) {
  const { t } = useT();
  const [consent, setConsent] = useState(false);
  const [gps, setGps] = useState<Gps>({ status: 'idle' });
  const [file, setFile] = useState<File | null>(null);
  const [camera, setCamera] = useState(false);
  const [note, setNote] = useState('');
  const [noteMsg, setNoteMsg] = useState('');

  const acquireGps = () => {
    setGps({ status: 'busy' });
    navigator.geolocation?.getCurrentPosition(
      (p) => setGps({ status: 'ok', text: `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} (±${Math.round(p.coords.accuracy)}m)` }),
      (e) => setGps({ status: 'fail', text: e.message || 'Could not get a GPS fix' }),
      { enableHighAccuracy: true, timeout: 10000 },
    ) ?? setGps({ status: 'fail', text: 'Geolocation not supported' });
  };

  const ready = consent && gps.status === 'ok' && !!file;
  const today = new Date().toDateString();
  const todays = history.filter((s) => new Date(s.punch_in_at).toDateString() === today);
  const liveSecs = session ? (Date.now() - new Date(session.punch_in_at).getTime()) / 1000 : 0;
  const loggedSecs = todays.filter((s) => s.status === 'COMPLETED').reduce((n, s) => n + s.duration_seconds, 0) + liveSecs;
  const shifts = new Set([...todays.map((s) => s.id), ...(session ? [session.id] : [])]).size;
  const drops = events.filter((e) => e.event_type === 'LOCATION_UNAVAILABLE' || e.event_type === 'LOCATION_PERMISSION_DENIED').length;

  const saveNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post('/attendance/notes/', { content: note.trim() });
      setNote('');
      setNoteMsg('Saved.');
    } catch (e) {
      setNoteMsg(errorMessage(e));
    }
  };

  const req = (ok: boolean, label: string) => (
    <li className={`flex items-center gap-2 text-xs ${ok ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
      <span className={`w-3.5 h-3.5 rounded-full border ${ok ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`} />
      {label}
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-900">{session ? 'Shift in progress' : 'Attendance Punch-In'}</h2>
            <p className="text-xs text-slate-500">
              {session ? `Punched in at ${fmtTime(session.punch_in_at)}` : 'Verify consent, acquire GPS lock, and capture front selfie'}
            </p>
          </div>
          <span className={`shrink-0 whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-full border ${session ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {session ? t('onDuty') : t('offDuty')}
          </span>
        </div>

        {session ? (
          <>
            <p className="text-center text-3xl font-mono font-extrabold text-slate-900 py-2">{fmtDuration(liveSecs)}</p>
            <button type="button" disabled={busy} onClick={onPunchOut} className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold tracking-wide disabled:opacity-50">
              {busy ? 'Please wait…' : 'PUNCH OUT (END SHIFT)'}
            </button>
          </>
        ) : (
          <>
            <Step n={1} title="Session Location & Selfie Consent">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-4 h-4 accent-emerald-500" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                I consent to session-scoped location tracking and selfie attendance verification for my shift (Policy v1.0).
              </label>
            </Step>

            <Step n={2} title="GPS Position Fix" right={<button type="button" onClick={acquireGps} className="text-xs font-bold text-blue-600 hover:underline">{gps.status === 'busy' ? 'Locating…' : gps.status === 'ok' ? 'Refresh' : 'Acquire GPS'}</button>}>
              {gps.text && <p className={`text-xs font-mono ${gps.status === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>{gps.text}</p>}
            </Step>

            <Step n={3} title="Front Selfie Verification">
              {file ? (
                <div className="flex items-center gap-3">
                  <img src={URL.createObjectURL(file)} alt="Selfie preview" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                  <button type="button" onClick={() => setFile(null)} className="text-xs font-bold text-rose-500">Retake</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCamera(true)} className="py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold">Open Live Camera</button>
                  <label className="py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold text-center cursor-pointer">
                    Upload Photo Instead
                    <input type="file" accept="image/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              )}
            </Step>

            <div className="rounded-2xl border border-slate-100 p-4 space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Punch-in requirements</p>
              <ul className="space-y-1.5">
                {req(consent, 'Privacy & Tracking Policy Consent')}
                {req(gps.status === 'ok', 'Accurate GPS Location')}
                {req(!!file, 'Front Selfie / Verification Photo')}
              </ul>
            </div>

            <button type="button" disabled={!ready || busy} onClick={() => file && onPunchIn(file)} className={`w-full py-3.5 rounded-2xl font-extrabold tracking-wide ${ready && !busy ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              {busy ? 'Punching in…' : 'PUNCH IN (START SHIFT)'}
            </button>
          </>
        )}
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">{t('todaysShift')}</h3>
          <span className="text-xs text-slate-500">{fmtDate(new Date().toISOString())}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[[t('loggedHours'), fmtDuration(loggedSecs)], [t('shifts'), String(shifts)], [t('gpsDrops'), String(drops)]].map(([k, v]) => (
            <div key={k} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] text-slate-500">{k}</p>
              <p className="font-mono font-bold text-slate-900 mt-1">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">{t('fieldNotes')}</h3>
        <textarea className="input min-h-[90px]" placeholder="Record notes about today's client meetings, field visits, or tasks…" value={note} onChange={(e) => { setNote(e.target.value); setNoteMsg(''); }} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{noteMsg}</span>
          <button type="button" onClick={saveNote} className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">{t('saveNotes')}</button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-100">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">{t('recentShifts')}</h3>
          <button type="button" onClick={onGoHistory} className="text-xs font-bold text-blue-600">{t('viewAll')}</button>
        </div>
        {history.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-3">No previous sessions recorded.</p>
        ) : (
          history.slice(0, 3).map((s) => (
            <div key={s.id} className="flex justify-between py-2 text-sm border-b last:border-0 border-slate-50">
              <span className="font-semibold text-slate-700">{fmtDate(s.punch_in_at)}</span>
              <span className="text-slate-500">{fmtTime(s.punch_in_at)} – {s.punch_out_at ? fmtTime(s.punch_out_at) : 'Active'}</span>
              <span className="font-mono text-xs text-slate-600">{fmtDuration(s.duration_seconds)}</span>
            </div>
          ))
        )}
      </div>

      {camera && (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col">
          <button type="button" onClick={() => setCamera(false)} className="absolute top-3 right-3 z-[120] w-9 h-9 rounded-full bg-white/90 text-slate-700 font-bold">✕</button>
          <div className="relative flex-1">
            <LiveCamera buttonLabel="Capture Selfie" onCapture={(f) => { setFile(f); setCamera(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}
