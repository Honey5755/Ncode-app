import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AdminList, { cardStyles as c, Header, Pill } from '../../components/AdminList';
import { useAuth } from '../../hooks/useAuth';
import { can } from '../../services/permissions';
import type { Session, Visit } from '../../types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');
const dur = (s: number) => `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;

type Sess = Session & { display_name: string; employee_id?: string; visits_count?: number };
type AVisit = Visit & { display_name?: string; employee_name?: string };

export default function Attendance() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'sessions' | 'visits'>(can(user, 'attendance.sessions') ? 'sessions' : 'visits');

  const toggle = (
    <Header title="Attendance & Visits">
      <View style={styles.seg}>
        {(['sessions', 'visits'] as const)
          .filter((t) => can(user, t === 'sessions' ? 'attendance.sessions' : 'attendance.visits'))
          .map((t) => (
            <TouchableOpacity key={t} style={[styles.segBtn, tab === t && styles.segOn]} onPress={() => setTab(t)}>
              <Text style={{ color: tab === t ? '#fff' : '#475569', fontWeight: '600' }}>
                {t === 'sessions' ? 'Records' : 'Field Visits'}
              </Text>
            </TouchableOpacity>
          ))}
      </View>
    </Header>
  );

  return tab === 'sessions' ? (
    <AdminList<Sess>
      url="/admin/sessions/"
      header={toggle}
      renderItem={(s) => (
        <>
          <View style={c.row}>
            <Text style={c.name}>{s.display_name}</Text>
            <Pill text={s.status} color={s.status === 'ACTIVE' ? '#16a34a' : '#64748b'} bg={s.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9'} />
          </View>
          <Text style={c.meta}>In: {fmt(s.punch_in_at)}</Text>
          <Text style={c.meta}>Out: {fmt(s.punch_out_at)} · {dur(s.duration_seconds)}</Text>
          <Text style={c.meta}>Tracking: {s.tracking_status} · {s.visits_count ?? 0} visits</Text>
        </>
      )}
    />
  ) : (
    <AdminList<AVisit>
      url="/admin/visits/"
      header={toggle}
      renderItem={(v) => (
        <>
          <View style={c.row}>
            <Text style={c.name}>{v.site_name}</Text>
            <Pill text={v.status} />
          </View>
          <Text style={c.meta}>{v.display_name ?? v.employee_name ?? ''}</Text>
          <Text style={c.meta}>{v.location_name} · {fmt(v.start_time)}</Text>
          {v.outcome ? <Text style={c.meta}>Outcome: {v.outcome}</Text> : null}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', gap: 8, marginTop: 10 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  segOn: { backgroundColor: '#0088ff' },
});
