import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AdminList, { cardStyles as c, Header, Pill } from '../../components/AdminList';
import api, { errorMessage } from '../../services/api';
import type { LeaveStatus } from '../../types';

interface Leave {
  id: number;
  employee_name: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
}

const FILTERS: (LeaveStatus | 'ALL')[] = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

export default function Leaves() {
  const [filter, setFilter] = useState<LeaveStatus | 'ALL'>('PENDING');

  const decide = async (id: number, status: LeaveStatus, reload: () => void) => {
    try {
      await api.patch(`/admin/leaves/${id}/`, { status });
      reload();
    } catch (e) {
      Alert.alert('Failed', errorMessage(e));
    }
  };

  return (
    <AdminList<Leave>
      url="/admin/leaves/"
      params={filter === 'ALL' ? undefined : { status: filter }}
      reloadKey={filter}
      empty="No leave requests."
      header={
        <Header title="Leave Requests">
          <View style={styles.seg}>
            {FILTERS.map((f) => (
              <TouchableOpacity key={f} style={[styles.btn, filter === f && styles.on]} onPress={() => setFilter(f)}>
                <Text style={{ color: filter === f ? '#fff' : '#475569', fontSize: 12, fontWeight: '600' }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Header>
      }
      renderItem={(l, reload) => (
        <>
          <View style={c.row}>
            <Text style={c.name}>{l.employee_name}</Text>
            <Pill text={l.status} />
          </View>
          <Text style={c.meta}>{l.employee_id} · {l.leave_type} · {l.start_date} → {l.end_date}</Text>
          {l.reason ? <Text style={c.meta}>{l.reason}</Text> : null}
          {l.status === 'PENDING' && (
            <View style={[c.row, { marginTop: 10 }]}>
              <TouchableOpacity style={[styles.act, { backgroundColor: '#16a34a' }]} onPress={() => decide(l.id, 'APPROVED', reload)}>
                <Text style={styles.actText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.act, { backgroundColor: '#dc2626' }]} onPress={() => decide(l.id, 'REJECTED', reload)}>
                <Text style={styles.actText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', gap: 6, marginTop: 10 },
  btn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#f1f5f9' },
  on: { backgroundColor: '#0088ff' },
  act: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actText: { color: '#fff', fontWeight: '700' },
});
