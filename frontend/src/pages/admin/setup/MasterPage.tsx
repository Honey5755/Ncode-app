import { FormEvent, ReactNode, useEffect, useState } from 'react';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../hooks/useAuth';
import useOptions from '../../../hooks/useOptions';
import api, { errorMessage } from '../../../services/api';
import { can } from '../../../services/permissions';
import type { MasterRow, Options, Page, ScreenKey } from '../../../types';

/**
 * Generic List | Form screen (GWSSB style) shared by every SetUp master, Employee, Role and User.
 * Each screen is a MasterConfig: list columns, Search Criteria filters and form fields.
 */

export type SelectOpt = { value: string | number; label: string };
type Row = MasterRow;
type ChoiceKey = keyof Options['choices'];

export interface MasterField {
  name: string;
  label: string;
  /** select = FK id (empty → null) · choice = string enum (empty → '') · multi = id checkbox list. */
  type?: 'text' | 'email' | 'number' | 'date' | 'password' | 'textarea' | 'select' | 'choice' | 'multi' | 'checkbox';
  required?: boolean;
  options?: (o: Options, form: Row) => SelectOpt[];
  /** Extra form changes when this field changes — clear cascaded children, prefill related fields. */
  onChange?: (value: unknown, form: Row, o: Options) => Row;
  show?: (form: Row) => boolean; // hidden fields are left out of the request
  disabled?: (form: Row) => boolean;
  hint?: string;
  wide?: boolean; // span both form columns
  render?: (value: unknown, set: (v: unknown) => void, o: Options, form: Row) => ReactNode; // custom input
}

export interface MasterColumn {
  key: string;
  label: string;
  choice?: ChoiceKey; // show the choice's label instead of its raw value
  render?: (row: Row) => ReactNode;
}

export interface MasterFilter {
  name: string; // query param
  label: string;
  options: (o: Options) => SelectOpt[];
}

export interface MasterConfig {
  title: string;
  module: string; // header subtitle, e.g. "SetUp"
  screen: ScreenKey;
  endpoint: string; // collection URL with trailing slash
  columns: MasterColumn[];
  filters: MasterFilter[];
  fields: MasterField[];
  defaults?: Row; // values for a new record
  searchPlaceholder?: string;
  deleteLabel?: string; // e.g. "Deactivate" for soft deletes
  confirmDelete?: (row: Row) => string;
  canDeleteRow?: (row: Row) => boolean;
  noDelete?: boolean;
}

/** {id,label} option rows → select options. */
export const ids = (list: { id: number; label: string }[]): SelectOpt[] => list.map((x) => ({ value: x.id, label: x.label }));

const PAGE_SIZE = 50;
const str = (v: unknown) => (v == null ? '' : String(v));
const nonEmpty = (p: Record<string, string>) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== ''));

export function StatusBadge({ value }: { value: unknown }) {
  const cls = value === 'ACTIVE' ? 'badge-success' : value === 'ON_LEAVE' ? 'badge-warning' : 'badge-danger';
  return <span className={`badge ${cls}`}>{str(value).replace('_', ' ')}</span>;
}

export default function MasterPage({
  config,
  initialForm,
  onSaved,
}: {
  config: MasterConfig;
  initialForm?: Row; // open straight on the create form with these values
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const { options, reload: reloadOptions } = useOptions();
  const canAdd = can(user, config.screen, 'add');
  const canEdit = can(user, config.screen, 'edit');
  const canDelete = !config.noDelete && can(user, config.screen, 'delete');

  const [tab, setTab] = useState<'list' | 'form'>(initialForm && canAdd ? 'form' : 'list');
  const [form, setForm] = useState<Row>({ ...config.defaults, ...initialForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [criteria, setCriteria] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Row>>({ count: 0, results: [] });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<Page<Row>>(config.endpoint, { params: { ...nonEmpty(applied), page, page_size: PAGE_SIZE } })
      .then((r) => alive && setData(r.data))
      .catch((e) => {
        if (!alive) return;
        setData({ count: 0, results: [] });
        setMessage({ ok: false, text: errorMessage(e) });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [config.endpoint, applied, page, reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setApplied({ ...criteria }); // new object so Search always refetches
  };

  const resetCriteria = () => {
    setCriteria({});
    setPage(1);
    setApplied({});
  };

  // Same approach as the dashboard's CSV exports: fetch through axios (JWT) as a blob, then click a temporary link.
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get(`${config.endpoint}export/`, { params: nonEmpty(applied), responseType: 'blob' });
      const name = /filename="?([^"]+)"?/.exec(String(res.headers['content-disposition'] ?? ''))?.[1] ?? 'export.csv';
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ ok: false, text: 'Export failed. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const openForm = (row?: Row) => {
    setForm(row ? { ...row } : { ...config.defaults });
    setErrors({});
    setMessage(null);
    setTab('form');
  };

  const set = (f: MasterField, value: unknown) =>
    setForm((prev) => {
      const next = { ...prev, [f.name]: value };
      return options && f.onChange ? { ...next, ...f.onChange(value, next, options) } : next;
    });

  const visibleFields = config.fields.filter((f) => !f.show || f.show(form));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body: Row = {};
    const files: [string, File][] = [];
    for (const f of visibleFields) {
      let v = form[f.name];
      if (v === undefined) continue;
      if (v instanceof File) {
        files.push([f.name, v]);
        continue;
      }
      if (v === '' && (f.type === 'select' || f.type === 'number' || f.type === 'date')) v = null;
      body[f.name] = v;
    }
    try {
      const { data: saved } = form.id
        ? await api.patch<Row>(`${config.endpoint}${form.id}/`, body)
        : await api.post<Row>(config.endpoint, body);
      if (files.length) {
        // Files go up as a second multipart PATCH so arrays/nulls above keep plain JSON semantics.
        // If the upload fails the user stays on the form, now editing the saved record.
        setForm((prev) => ({ ...prev, id: saved.id }));
        const fd = new FormData();
        files.forEach(([k, file]) => fd.append(k, file));
        await api.patch(`${config.endpoint}${saved.id}/`, fd);
      }
      setMessage({ ok: true, text: `${config.title} ${form.id ? 'updated' : 'created'} successfully.` });
      setTab('list');
      refresh();
      reloadOptions();
      onSaved?.();
    } catch (err) {
      const d = (err as { response?: { data?: unknown } }).response?.data;
      setErrors(
        d && typeof d === 'object' && !('detail' in d)
          ? Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v.join(' ') : str(v)]))
          : { detail: errorMessage(err) },
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    const label = config.deleteLabel ?? 'Delete';
    if (!confirm(config.confirmDelete?.(row) ?? `${label} this ${config.title} record? This cannot be undone.`)) return;
    try {
      await api.delete(`${config.endpoint}${row.id}/`);
      setMessage({ ok: true, text: `${config.title} ${label === 'Delete' ? 'deleted' : `${label.toLowerCase()}d`}.` });
      if (data.results.length === 1 && page > 1) setPage(page - 1);
      else refresh();
      reloadOptions();
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    }
  };

  const cell = (row: Row, c: MasterColumn): ReactNode => {
    if (c.render) return c.render(row);
    const v = row[c.key];
    if (c.key === 'status') return <StatusBadge value={v} />;
    if (v == null || v === '') return '—';
    if (c.choice && options) return options.choices[c.choice].find((x) => x.value === v)?.label ?? String(v);
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };

  const input = (f: MasterField, o: Options): ReactNode => {
    const v = form[f.name];
    const disabled = f.disabled?.(form) ?? false;
    const common = { id: `f-${f.name}`, disabled, required: f.required && !disabled };
    if (f.render) return f.render(v, (x) => set(f, x), o, form);
    switch (f.type) {
      case 'textarea':
        return <textarea className="input h-20" value={str(v)} onChange={(e) => set(f, e.target.value)} {...common} />;
      case 'checkbox':
        return (
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 h-9 cursor-pointer">
            <input type="checkbox" className="accent-[#00a29a] w-4 h-4" checked={!!v} onChange={(e) => set(f, e.target.checked)} disabled={disabled} />
            {f.label}
          </label>
        );
      case 'select':
      case 'choice': {
        let opts = f.options?.(o, form) ?? [];
        // Keep a current value that is no longer offered (e.g. an Inactive master) visible instead of blanking it.
        if (v != null && v !== '' && !opts.some((x) => x.value === v)) opts = [{ value: v as string | number, label: str(form[`${f.name}_name`] ?? v) }, ...opts];
        return (
          <select
            className="input"
            value={str(v)}
            onChange={(e) => {
              const raw = e.target.value;
              set(f, f.type === 'select' ? (raw === '' ? null : Number(raw)) : raw);
            }}
            {...common}
          >
            <option value="">-- Select --</option>
            {opts.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        );
      }
      case 'multi': {
        const sel = Array.isArray(v) ? (v as (string | number)[]) : [];
        const opts = f.options?.(o, form) ?? [];
        return (
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 rounded border border-slate-300 bg-white px-3 py-2 max-h-44 overflow-y-auto">
            {opts.length === 0 && <span className="text-xs text-slate-400">No active options available.</span>}
            {opts.map((x) => (
              <label key={x.value} className="inline-flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#00a29a]"
                  checked={sel.includes(x.value)}
                  disabled={disabled}
                  onChange={(e) => set(f, e.target.checked ? [...sel, x.value] : sel.filter((s) => s !== x.value))}
                />
                {x.label}
              </label>
            ))}
          </div>
        );
      }
      default:
        return (
          <input
            className="input"
            type={f.type ?? 'text'}
            step={f.type === 'number' ? 'any' : undefined}
            // Mirrors Django's MinimumLength/NumericPassword validators so obvious rejects never reach the server.
            minLength={f.type === 'password' ? 8 : undefined}
            pattern={f.type === 'password' ? '.*\\D.*' : undefined}
            title={f.type === 'password' ? 'At least 8 characters and not entirely numeric' : undefined}
            autoComplete={f.type === 'password' ? 'new-password' : undefined}
            value={str(v)}
            onChange={(e) => set(f, e.target.value)}
            {...common}
          />
        );
    }
  };

  const fieldNames = new Set(visibleFields.map((f) => f.name));
  const generalErrors = Object.entries(errors).filter(([k]) => !fieldNames.has(k));
  const pages = Math.max(1, Math.ceil(data.count / PAGE_SIZE));
  const first = data.count ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showActions = canEdit || canDelete;

  return (
    <Layout title={config.title} subtitle={`${config.module} · ${config.title}`}>
      {message && (
        <div
          className={`rounded-lg border p-3 text-sm flex items-start gap-3 whitespace-pre-line ${
            message.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span className="flex-1">{message.text}</span>
          <button type="button" aria-label="Dismiss" className="opacity-60 hover:opacity-100" onClick={() => setMessage(null)}>
            ✕
          </button>
        </div>
      )}

      <div>
        <div role="tablist" className="flex items-end gap-1 border-b border-slate-300">
          {(['list', 'form'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              disabled={t === 'form' && tab !== 'form' && !canAdd}
              onClick={() => (t === 'list' ? setTab('list') : tab !== 'form' && openForm())}
              className={`-mb-px px-4 py-2 text-xs font-semibold rounded-t border border-b-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                tab === t ? 'bg-white text-[#00a29a] border-slate-300' : 'bg-slate-200/70 text-slate-500 border-transparent hover:text-slate-800'
              }`}
            >
              {t === 'list' ? 'List' : config.title}
            </button>
          ))}
        </div>

        {tab === 'list' ? (
          <div className="card space-y-4 border-t-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">{config.title} List</h2>
                <p className="text-xs text-slate-500">
                  {data.count} record{data.count === 1 ? '' : 's'}
                  {Object.keys(nonEmpty(applied)).length > 0 && ' (filtered)'}
                </p>
              </div>
              {canAdd && (
                <button type="button" className="btn btn-primary self-start sm:self-auto" onClick={() => openForm()}>
                  + Add New
                </button>
              )}
            </div>

            {/* Search Criteria */}
            <form onSubmit={search} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Search Criteria
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="label" htmlFor="crit-search">Search</label>
                  <input
                    id="crit-search"
                    className="input !py-1.5 !text-xs"
                    placeholder={config.searchPlaceholder ?? 'Code or name...'}
                    value={criteria.search ?? ''}
                    onChange={(e) => setCriteria({ ...criteria, search: e.target.value })}
                  />
                </div>
                {config.filters.map((f) => (
                  <div key={f.name}>
                    <label className="label" htmlFor={`crit-${f.name}`}>{f.label}</label>
                    <select
                      id={`crit-${f.name}`}
                      className="input !py-1.5 !text-xs"
                      value={criteria[f.name] ?? ''}
                      onChange={(e) => setCriteria({ ...criteria, [f.name]: e.target.value })}
                    >
                      <option value="">All</option>
                      {(options ? f.options(options) : []).map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-1 border-t border-slate-200/60">
                <button type="button" className="btn btn-ghost" onClick={resetCriteria}>
                  Reset
                </button>
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
                <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={exporting || data.count === 0}>
                  {exporting ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead className="text-xs uppercase bg-[#00a29a] text-white">
                  <tr>
                    <th className="py-2.5 px-3 w-14">Sr. No.</th>
                    {config.columns.map((c) => (
                      <th key={c.key} className="px-3">
                        {c.label}
                      </th>
                    ))}
                    {showActions && <th className="px-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.results.length === 0 ? (
                    <tr>
                      <td colSpan={config.columns.length + 2} className="py-8 text-center text-slate-400">
                        {loading ? 'Loading records...' : 'No records found.'}
                      </td>
                    </tr>
                  ) : (
                    data.results.map((row, i) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-xs text-slate-500">{first + i}</td>
                        {config.columns.map((c) => (
                          <td key={c.key} className="px-3 text-xs text-slate-700">
                            {cell(row, c)}
                          </td>
                        ))}
                        {showActions && (
                          <td className="px-3 text-right whitespace-nowrap">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openForm(row)}
                                title="Edit"
                                aria-label="Edit"
                                className="p-1.5 rounded text-[#00a29a] hover:bg-teal-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {canDelete && (config.canDeleteRow?.(row) ?? true) && (
                              <button
                                type="button"
                                onClick={() => remove(row)}
                                title={config.deleteLabel ?? 'Delete'}
                                aria-label={config.deleteLabel ?? 'Delete'}
                                className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.deleteLabel ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'} /></svg>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                Showing <strong>{first}</strong>–<strong>{first ? first + data.results.length - 1 : 0}</strong> of <strong>{data.count}</strong>
                {loading && <span className="ml-2 text-blue-800 font-semibold animate-pulse">Loading...</span>}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-ghost !py-1 !px-2.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  ← Prev
                </button>
                <span>
                  Page {page} of {pages}
                </span>
                <button type="button" className="btn btn-ghost !py-1 !px-2.5" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  Next →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={save} className="card space-y-4 border-t-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">
                {form.id ? `Edit ${config.title}` : `Add New ${config.title}`}
              </h2>
              <p className="text-[11px] font-semibold text-rose-600">
                All fields marked <span aria-hidden="true">*</span> are mandatory
              </p>
            </div>

            {generalErrors.length > 0 && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 whitespace-pre-line">
                {generalErrors.map(([k, v]) => (k === 'detail' || k === 'non_field_errors' ? v : `${k}: ${v}`)).join('\n')}
              </div>
            )}

            {!options ? (
              <p className="py-6 text-center text-sm text-slate-400">Loading form...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {visibleFields.map((f) => (
                  <div key={f.name} className={f.wide ? 'md:col-span-2' : ''}>
                    {f.type !== 'checkbox' && (
                      <label htmlFor={`f-${f.name}`} className="label">
                        {f.label}
                        {f.required && <span className="text-rose-600"> *</span>}
                      </label>
                    )}
                    {input(f, options)}
                    {f.hint && <p className="mt-1 text-[11px] text-slate-500">{f.hint}</p>}
                    {errors[f.name] && <p className="mt-1 text-[11px] font-medium text-rose-600">{errors[f.name]}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" className="btn btn-ghost" onClick={() => setTab('list')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !options || (form.id ? !canEdit : !canAdd)}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
