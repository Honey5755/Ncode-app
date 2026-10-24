import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import api, { errorMessage } from '../../services/api';
import { getCurrentPoint } from '../../services/tracking';
import type { Session, Visit, VisitType } from '../../types';

const VISIT_TYPES: { value: VisitType; label: string }[] = [
  { value: 'SITE_INSPECTION', label: 'Site Inspection' },
  { value: 'CLIENT_MEETING', label: 'Client Meeting' },
  { value: 'TECHNICAL_VERIFICATION', label: 'Technical Verification' },
  { value: 'INFRASTRUCTURE_AUDIT', label: 'Infrastructure Audit' },
  { value: 'OTHER', label: 'Other' },
];

function visitTypeLabel(type?: VisitType) {
  return VISIT_TYPES.find((t) => t.value === type)?.label ?? type ?? '—';
}

const STATUS_FILTERS: { value: '' | Visit['status']; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function statusColors(status: Visit['status']) {
  switch (status) {
    case 'COMPLETED':
      return { bg: '#ecfdf5', fg: '#16a34a' };
    case 'CANCELLED':
      return { bg: '#f1f5f9', fg: '#64748b' };
    default:
      return { bg: '#fffbeb', fg: '#d97706' };
  }
}

type ActionBusy = { id: number; kind: 'complete' | 'photo' } | null;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function VisitsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('SITE_INSPECTION');
  const [notes, setNotes] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const [actionBusy, setActionBusy] = useState<ActionBusy>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | VisitType>('');
  const [statusFilter, setStatusFilter] = useState<'' | Visit['status']>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = typeFilter || statusFilter
        ? { ...(typeFilter ? { visit_type: typeFilter } : {}), ...(statusFilter ? { status: statusFilter } : {}) }
        : { all: 'true' };
      const [curRes, visitsRes] = await Promise.all([
        api.get('/attendance/current/'),
        api.get('/attendance/visits/', { params }),
      ]);
      setSession(curRes.data?.session ?? null);
      const list: Visit[] = visitsRes.data ?? [];
      list.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setVisits(list);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filteredVisits = visits.filter((v) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return v.site_name.toLowerCase().includes(q) || (v.project_name ?? '').toLowerCase().includes(q);
  });

  const createVisit = async () => {
    if (!siteName.trim()) {
      setFormError('Site name is required.');
      return;
    }
    setFormBusy(true);
    setFormError('');
    try {
      const point = await getCurrentPoint().catch(() => null);
      await api.post('/attendance/visits/', {
        site_name: siteName.trim(),
        project_name: projectName.trim() || undefined,
        visit_type: visitType,
        notes: notes.trim() || undefined,
        latitude: point?.latitude,
        longitude: point?.longitude,
      });
      setSiteName('');
      setProjectName('');
      setNotes('');
      setVisitType('SITE_INSPECTION');
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setFormBusy(false);
    }
  };

  const completeVisit = async (visit: Visit) => {
    setActionBusy({ id: visit.id, kind: 'complete' });
    setError('');
    try {
      const point = await getCurrentPoint().catch(() => null);
      await api.patch(`/attendance/visits/${visit.id}/`, {
        status: 'COMPLETED',
        end_latitude: point?.latitude,
        end_longitude: point?.longitude,
      });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionBusy(null);
    }
  };

  const addPhoto = async (visit: Visit) => {
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      setError('Camera permission is required to add a photo.');
      return;
    }
    const photo = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (photo.canceled) return;
    const asset = photo.assets[0];

    setActionBusy({ id: visit.id, kind: 'photo' });
    setError('');
    try {
      const point = await getCurrentPoint().catch(() => null);
      const form = new FormData();
      form.append('photo', {
        uri: asset.uri,
        name: 'visit-photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob);
      if (point) {
        form.append('latitude', String(point.latitude));
        form.append('longitude', String(point.longitude));
      }
      await api.post(`/attendance/visits/${visit.id}/photos/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionBusy(null);
    }
  };

  if (loading && visits.length === 0 && !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00c696" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <Text style={styles.title}>Visits</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!session ? (
        <View style={styles.card}>
          <Text style={styles.row}>Punch in first to log a visit.</Text>
        </View>
      ) : !formOpen ? (
        <TouchableOpacity style={styles.newButton} onPress={() => setFormOpen(true)}>
          <Text style={styles.newButtonText}>+ New Visit</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Visit</Text>

          <Text style={styles.label}>Site Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tower 14, Sector 9"
            placeholderTextColor="#94a3b8"
            value={siteName}
            onChangeText={setSiteName}
          />

          <Text style={styles.label}>Project Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Project name"
            placeholderTextColor="#94a3b8"
            value={projectName}
            onChangeText={setProjectName}
          />

          <Text style={styles.label}>Visit Type</Text>
          <View style={styles.chipRow}>
            {VISIT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, visitType === t.value && styles.chipActive]}
                onPress={() => setVisitType(t.value)}
              >
                <Text style={[styles.chipText, visitType === t.value && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes"
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <View style={styles.formButtonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setFormOpen(false);
                setFormError('');
              }}
              disabled={formBusy}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={createVisit} disabled={formBusy}>
              {formBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start Visit</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>My Visits</Text>

      <TextInput
        style={styles.input}
        placeholder="Search by site or project name"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, typeFilter === '' && styles.chipActive]}
          onPress={() => setTypeFilter('')}
        >
          <Text style={[styles.chipText, typeFilter === '' && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {VISIT_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, typeFilter === t.value && styles.chipActive]}
            onPress={() => setTypeFilter(t.value)}
          >
            <Text style={[styles.chipText, typeFilter === t.value && styles.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Status</Text>
      <View style={styles.chipRow}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.chip, statusFilter === s.value && styles.chipActive]}
            onPress={() => setStatusFilter(s.value)}
          >
            <Text style={[styles.chipText, statusFilter === s.value && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredVisits.length === 0 ? (
        <Text style={styles.empty}>No visits logged yet.</Text>
      ) : (
        filteredVisits.map((v) => {
          const colors = statusColors(v.status);
          const inProgress = v.status === 'IN_PROGRESS';
          const busyHere = actionBusy?.id === v.id;
          return (
            <View key={v.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.siteName}>{v.site_name}</Text>
                <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.badgeText, { color: colors.fg }]}>{v.status}</Text>
                </View>
              </View>
              <View style={styles.fieldGrid}>
                <Field label="Type" value={visitTypeLabel(v.visit_type)} />
                {v.project_name ? <Field label="Project" value={v.project_name} /> : null}
                <Field label="Started" value={new Date(v.start_time).toLocaleString()} />
                {v.end_time ? <Field label="Ended" value={new Date(v.end_time).toLocaleString()} /> : null}
                {(v.end_location_name || v.end_latitude != null) && (
                  <Field
                    label="End Location"
                    value={v.end_location_name || `${v.end_latitude?.toFixed(5)}, ${v.end_longitude?.toFixed(5)}`}
                  />
                )}
                {v.notes ? <Field label="Notes" value={v.notes} /> : null}
                {!!v.photos_count && <Field label="Photos" value={`${v.photos_count} attached`} />}
              </View>

              {inProgress && (
                <View style={styles.formButtonRow}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => addPhoto(v)}
                    disabled={!!actionBusy}
                  >
                    {busyHere && actionBusy?.kind === 'photo' ? (
                      <ActivityIndicator color="#00c696" />
                    ) : (
                      <Text style={styles.photoButtonText}>Add Photo</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => completeVisit(v)}
                    disabled={!!actionBusy}
                  >
                    {busyHere && actionBusy?.kind === 'complete' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Complete Visit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 8, marginBottom: 12 },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginVertical: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: { height: 70, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: '#00c696', borderColor: '#00c696' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#fff' },
  newButton: {
    backgroundColor: '#00c696',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  formButtonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: { flex: 1, backgroundColor: '#00c696', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  completeButton: { flex: 1, backgroundColor: '#00c696', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  photoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00c696',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoButtonText: { color: '#00c696', fontWeight: '700', fontSize: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  siteName: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { fontSize: 13, color: '#475569', marginBottom: 2 },
  sub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  fieldGrid: { marginTop: 8, gap: 6 },
  fieldRow: { flexDirection: 'row' },
  fieldLabel: { width: 64, fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldValue: { flex: 1, fontSize: 13, color: '#334155' },
});
