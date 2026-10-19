import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SelfieImage from '../../../components/SelfieImage';
import { useAuth } from '../../../hooks/useAuth';
import { can } from '../../../services/permissions';
import type { MasterRow, Options } from '../../../types';
import { ids, type MasterConfig, type MasterField } from './MasterPage';

const status: MasterField = { name: 'status', label: 'Status', type: 'choice', required: true, options: (o) => o.choices.status };
const statusFilter = { name: 'status', label: 'Status', options: (o: Options) => o.choices.status };
const defaults = { status: 'ACTIVE' };

/** Districts under the chosen zone (all when no zone is picked). */
const districtsOf = (o: Options, zone: unknown) => ids(o.districts.filter((d) => !zone || d.zone === zone));
const talukasOf = (o: Options, district: unknown) => ids(o.talukas.filter((t) => !district || t.district === district));

const zones: MasterConfig = {
  title: 'Zone / District',
  module: 'SetUp',
  screen: 'setup.zone_district',
  endpoint: '/admin/masters/zones/',
  searchPlaceholder: 'Code or name...',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type', choice: 'zone_district_type' },
    { key: 'name_en', label: 'Name (English)' },
    { key: 'name_hi', label: 'Name (Hindi)' },
    { key: 'reports_to_name', label: 'Reports To' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'status', label: 'Status' },
  ],
  filters: [
    { name: 'type', label: 'Type', options: (o) => o.choices.zone_district_type },
    statusFilter,
    { name: 'reports_to', label: 'Reports To', options: (o) => ids([...o.zones, ...o.districts]) },
  ],
  fields: [
    { name: 'code', label: 'Code', required: true },
    { name: 'type', label: 'Type', type: 'choice', required: true, options: (o) => o.choices.zone_district_type },
    { name: 'name_en', label: 'Name (English)', required: true },
    { name: 'name_hi', label: 'Name (Hindi)' },
    { name: 'latitude', label: 'Latitude', type: 'number' },
    { name: 'longitude', label: 'Longitude', type: 'number' },
    {
      name: 'reports_to',
      label: 'Reports To',
      type: 'select',
      hint: 'Typically a District reports to a Zone.',
      options: (o, f) => ids([...o.zones, ...o.districts].filter((z) => z.id !== f.id)),
    },
    { name: 'mobile', label: 'Mobile' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'fax', label: 'Fax' },
    status,
    { name: 'address', label: 'Address', type: 'textarea', wide: true },
  ],
  defaults,
};

const talukas: MasterConfig = {
  title: 'Taluka / Village',
  module: 'SetUp',
  screen: 'setup.taluka_village',
  endpoint: '/admin/masters/talukas/',
  searchPlaceholder: 'Code, name or PIN...',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type', choice: 'taluka_village_type' },
    { key: 'name_en', label: 'Name (English)' },
    { key: 'name_gu', label: 'Name (Gujarati)' },
    { key: 'pin_code', label: 'PIN Code' },
    { key: 'district_name', label: 'District' },
    { key: 'taluka_name', label: 'Parent Taluka' },
    { key: 'status', label: 'Status' },
  ],
  filters: [
    { name: 'type', label: 'Type', options: (o) => o.choices.taluka_village_type },
    statusFilter,
    { name: 'district', label: 'District', options: (o) => ids(o.districts) },
    { name: 'taluka', label: 'Parent Taluka', options: (o) => ids(o.talukas) },
  ],
  fields: [
    { name: 'code', label: 'Code', required: true },
    { name: 'type', label: 'Type', type: 'choice', required: true, options: (o) => o.choices.taluka_village_type },
    { name: 'name_en', label: 'Name (English)', required: true },
    { name: 'name_gu', label: 'Name (Gujarati)' },
    { name: 'pin_code', label: 'PIN Code' },
    { name: 'district', label: 'District', type: 'select', options: (o) => ids(o.districts), onChange: () => ({ taluka: null }) },
    {
      name: 'taluka',
      label: 'Parent Taluka',
      type: 'select',
      hint: 'Villages only — the taluka this village belongs to.',
      options: (o, f) => talukasOf(o, f.district).filter((t) => t.value !== f.id),
    },
    status,
  ],
  defaults,
};

const agencies: MasterConfig = {
  title: 'Agency',
  module: 'SetUp',
  screen: 'setup.agency',
  endpoint: '/admin/masters/agencies/',
  searchPlaceholder: 'Name, contact, mobile, email...',
  columns: [
    { key: 'name', label: 'Agency Name' },
    { key: 'agency_type', label: 'Agency Type', choice: 'agency_type' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email' },
    { key: 'company_names', label: 'Companies' },
    { key: 'status', label: 'Status' },
  ],
  filters: [
    { name: 'agency_type', label: 'Agency Type', options: (o) => o.choices.agency_type },
    statusFilter,
    { name: 'companies', label: 'Company', options: (o) => ids(o.companies) },
  ],
  fields: [
    { name: 'name', label: 'Agency Name', required: true },
    { name: 'agency_type', label: 'Agency Type', type: 'choice', required: true, options: (o) => o.choices.agency_type },
    { name: 'contact_person', label: 'Contact Person' },
    { name: 'mobile', label: 'Mobile' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'telephone', label: 'Telephone' },
    { name: 'companies', label: 'Companies', type: 'multi', wide: true, options: (o) => ids(o.companies) },
    { name: 'address', label: 'Address', type: 'textarea', wide: true },
    status,
  ],
  defaults: { ...defaults, companies: [] },
};

const offices: MasterConfig = {
  title: 'Office',
  module: 'SetUp',
  screen: 'setup.office',
  endpoint: '/admin/masters/offices/',
  searchPlaceholder: 'Name, mobile, email...',
  columns: [
    { key: 'name_en', label: 'Office Name' },
    { key: 'company_name', label: 'Company' },
    { key: 'office_type', label: 'Office Type', choice: 'office_type' },
    { key: 'zone_name', label: 'Zone' },
    { key: 'district_name', label: 'District' },
    { key: 'taluka_name', label: 'Taluka' },
    { key: 'reporting_office_name', label: 'Reporting Office' },
    { key: 'status', label: 'Status' },
  ],
  filters: [
    { name: 'company', label: 'Company', options: (o) => ids(o.companies) },
    { name: 'office_type', label: 'Office Type', options: (o) => o.choices.office_type },
    { name: 'zone', label: 'Zone', options: (o) => ids(o.zones) },
    { name: 'district', label: 'District', options: (o) => ids(o.districts) },
    { name: 'taluka', label: 'Taluka', options: (o) => ids(o.talukas) },
    statusFilter,
  ],
  fields: [
    { name: 'name_en', label: 'Office Name (English)', required: true },
    { name: 'name_gu', label: 'Office Name (Gujarati)' },
    { name: 'mobile', label: 'Mobile' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'company', label: 'Company', type: 'select', required: true, options: (o) => ids(o.companies) },
    { name: 'office_type', label: 'Office Type', type: 'choice', required: true, options: (o) => o.choices.office_type },
    { name: 'zone', label: 'Zone', type: 'select', options: (o) => ids(o.zones), onChange: () => ({ district: null, taluka: null }) },
    { name: 'district', label: 'District', type: 'select', options: (o, f) => districtsOf(o, f.zone), onChange: () => ({ taluka: null }) },
    { name: 'taluka', label: 'Taluka', type: 'select', options: (o, f) => talukasOf(o, f.district) },
    { name: 'reporting_office', label: 'Reporting Office', type: 'select', options: (o, f) => ids(o.offices.filter((x) => x.id !== f.id)) },
    status,
  ],
  defaults,
};

const designations: MasterConfig = {
  title: 'Designation',
  module: 'SetUp',
  screen: 'setup.designation',
  endpoint: '/admin/masters/designations/',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name_en', label: 'Designation (English)' },
    { key: 'name_gu', label: 'Designation (Gujarati)' },
    { key: 'level', label: 'Level', choice: 'level' },
    { key: 'status', label: 'Status' },
  ],
  filters: [{ name: 'level', label: 'Level', options: (o) => o.choices.level }, statusFilter],
  fields: [
    { name: 'code', label: 'Code', required: true },
    { name: 'name_en', label: 'Designation (English)', required: true },
    { name: 'name_gu', label: 'Designation (Gujarati)' },
    { name: 'level', label: 'Level', type: 'choice', required: true, options: (o) => o.choices.level },
    status,
  ],
  defaults,
};

const wtpSites: MasterConfig = {
  title: 'WTP Inspection',
  module: 'SetUp',
  screen: 'setup.wtp_inspection',
  endpoint: '/admin/masters/wtp-sites/',
  searchPlaceholder: 'Code, name or RWSS...',
  columns: [
    { key: 'code', label: 'Inspection Code' },
    { key: 'name', label: 'Inspection Name' },
    { key: 'rwss_name', label: 'RWSS Name' },
    { key: 'zone_name', label: 'Zone' },
    { key: 'ward_name', label: 'Ward' },
    { key: 'company_name', label: 'Company' },
    { key: 'office_names', label: 'Offices' },
    { key: 'status', label: 'Status' },
  ],
  filters: [
    { name: 'zone', label: 'Zone', options: (o) => ids(o.zones) },
    { name: 'ward', label: 'Ward', options: (o) => ids(o.districts) },
    { name: 'company', label: 'Company', options: (o) => ids(o.companies) },
    { name: 'office_type', label: 'Office Type', options: (o) => o.choices.office_type },
    statusFilter,
  ],
  fields: [
    { name: 'code', label: 'Inspection Code', required: true },
    { name: 'name', label: 'Inspection Name', required: true },
    { name: 'rwss_name', label: 'RWSS Name', required: true },
    { name: 'latitude', label: 'Latitude', type: 'number', required: true },
    { name: 'longitude', label: 'Longitude', type: 'number' },
    { name: 'zone', label: 'Zone', type: 'select', required: true, options: (o) => ids(o.zones), onChange: () => ({ ward: null }) },
    { name: 'ward', label: 'Ward', type: 'select', required: true, options: (o, f) => districtsOf(o, f.zone) },
    { name: 'company', label: 'Company', type: 'select', required: true, options: (o) => ids(o.companies), onChange: () => ({ offices: [] }) },
    { name: 'agency_type', label: 'Agency Type', type: 'choice', options: (o) => o.choices.agency_type },
    { name: 'office_type', label: 'Office Type', type: 'choice', required: true, options: (o) => o.choices.office_type, onChange: () => ({ offices: [] }) },
    {
      name: 'offices',
      label: 'Offices',
      type: 'multi',
      required: true,
      wide: true,
      hint: 'Filtered by the selected Company and Office Type.',
      options: (o, f) =>
        ids(o.offices.filter((x) => (!f.company || x.company === f.company) && (!f.office_type || x.office_type === f.office_type))),
    },
    { name: 'remarks', label: 'Remarks', type: 'textarea', wide: true },
    status,
  ],
  defaults: { ...defaults, offices: [] },
};

/** Photo picker with preview: the chosen file, else the stored photo (JWT-protected, fetched as a blob). */
function PhotoField({ value, onChange, form }: { value: unknown; onChange: (f: File | undefined) => void; form: MasterRow }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [stamp] = useState(Date.now); // cache-buster: the photo URL stays the same after a re-upload
  useEffect(() => {
    if (!(value instanceof File)) return setPreview(null);
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);
  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <img src={preview} alt="New employee photo" className="h-20 w-20 rounded-xl object-cover border border-slate-200" />
      ) : (
        <SelfieImage path={form.photo_url && form.id ? `/auth/photo/${form.id}/?v=${stamp}` : null} alt="Employee photo" className="h-20 w-20" />
      )}
      <div className="min-w-0">
        <input
          id="f-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
              alert('Photo must be a JPEG, PNG or WebP image of 5 MB or less.');
              e.target.value = '';
              return;
            }
            onChange(file);
          }}
        />
        <p className="mt-1 text-[11px] text-slate-500">JPEG, PNG or WebP · max 5 MB</p>
      </div>
    </div>
  );
}

/** New employees have no login until User Management → User creates one. */
function LoginBadge({ row }: { row: MasterRow }) {
  const { user } = useAuth();
  if (row.has_login) return <span className="badge badge-success">Login</span>;
  return can(user, 'user_management.user', 'add') ? (
    <Link
      to={`/admin/user-management/users?employee=${row.id}`}
      title="Create a login under User Management → User"
      className="badge badge-warning hover:underline"
    >
      No login · Create
    </Link>
  ) : (
    <span className="badge badge-warning" title="Create a login under User Management → User">
      No login
    </span>
  );
}

const employees: MasterConfig = {
  title: 'Employee',
  module: 'SetUp',
  screen: 'setup.employee',
  endpoint: '/admin/employees/',
  searchPlaceholder: 'Code, name, mobile, email, ESIC...',
  deleteLabel: 'Deactivate',
  confirmDelete: (r) => `Deactivate ${String(r.name)}? Their attendance history is kept, but they can no longer sign in.`,
  canDeleteRow: (r) => !!r.is_active,
  columns: [
    { key: 'employee_code', label: 'Employee Code' },
    { key: 'name', label: 'Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'designation_name', label: 'Designation' },
    { key: 'office_name', label: 'Office' },
    { key: 'district_name', label: 'District' },
    { key: 'status', label: 'Status' },
    { key: 'has_login', label: 'Login', render: (r) => <LoginBadge row={r} /> },
  ],
  filters: [
    { name: 'company', label: 'Company', options: (o) => ids(o.companies) },
    { name: 'agency', label: 'Agency', options: (o) => ids(o.agencies) },
    { name: 'agency_type', label: 'Agency Type', options: (o) => o.choices.agency_type },
    { name: 'office', label: 'Office', options: (o) => ids(o.offices) },
    { name: 'designation', label: 'Designation', options: (o) => ids(o.designations) },
    { name: 'zone', label: 'Zone', options: (o) => ids(o.zones) },
    { name: 'district', label: 'District', options: (o) => ids(o.districts) },
    { name: 'status', label: 'Status', options: (o) => o.choices.employee_status },
  ],
  fields: [
    { name: 'employee_code', label: 'Employee Code', required: true },
    { name: 'name', label: 'Employee Name', required: true },
    { name: 'mobile', label: 'Mobile' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'esic_number', label: 'ESIC Number' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    {
      name: 'company',
      label: 'Company',
      type: 'select',
      options: (o) => ids(o.companies),
      onChange: () => ({ agency: null, office: null }),
    },
    {
      name: 'agency',
      label: 'Agency',
      type: 'select',
      options: (o, f) => ids(o.agencies.filter((a) => !f.company || a.companies.includes(f.company as number))),
      onChange: (v, _f, o) => ({ agency_type: o.agencies.find((a) => a.id === v)?.agency_type ?? '' }),
    },
    { name: 'agency_type', label: 'Agency Type', type: 'choice', options: (o) => o.choices.agency_type },
    { name: 'office', label: 'Office', type: 'select', options: (o, f) => ids(o.offices.filter((x) => !f.company || x.company === f.company)) },
    {
      name: 'designation',
      label: 'Designation',
      type: 'select',
      options: (o) => ids(o.designations),
      onChange: (v, _f, o) => ({ position: o.designations.find((d) => d.id === v)?.level ?? '' }),
    },
    { name: 'position', label: 'Position (Level)', type: 'choice', options: (o) => o.choices.level },
    { name: 'reports_to', label: 'Reports To', type: 'select', options: (o, f) => ids(o.employees.filter((e) => e.id !== f.id)) },
    { name: 'department', label: 'Department' },
    { name: 'zone', label: 'Zone', type: 'select', options: (o) => ids(o.zones), onChange: () => ({ district: null, taluka: null, village: null }) },
    { name: 'district', label: 'District', type: 'select', options: (o, f) => districtsOf(o, f.zone), onChange: () => ({ taluka: null, village: null }) },
    { name: 'taluka', label: 'Taluka', type: 'select', options: (o, f) => talukasOf(o, f.district), onChange: () => ({ village: null }) },
    { name: 'village', label: 'Village', type: 'select', options: (o, f) => ids(o.villages.filter((v) => !f.taluka || v.taluka === f.taluka)) },
    { name: 'status', label: 'Status', type: 'choice', required: true, options: (o) => o.choices.employee_status },
    {
      name: 'photo',
      label: 'Photo',
      render: (v, set, _o, form) => <PhotoField value={v} onChange={set} form={form} />,
    },
    { name: 'wtp_sites', label: 'WTP Sites', type: 'multi', wide: true, options: (o) => ids(o.wtp_sites) },
    { name: 'office_address', label: 'Office Address', type: 'textarea', wide: true },
  ],
  defaults: { status: 'ACTIVE', wtp_sites: [] },
};

/** SetUp screens by URL slug: /admin/setup/:slug */
export const SETUP_PAGES: Record<string, MasterConfig> = {
  zones,
  talukas,
  agencies,
  offices,
  designations,
  employees,
  'wtp-sites': wtpSites,
};
