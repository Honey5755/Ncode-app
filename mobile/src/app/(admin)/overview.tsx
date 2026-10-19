import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Header } from '../../components/AdminList';
import { useAuth } from '../../hooks/useAuth';
import api, { errorMessage } from '../../services/api';

interface Summary {
  total_users: number;
  active_users: number;
  currently_tracking: number;
  location_unavailable: number;
  today_punch_ins: number;
  today_punch_outs: number;
  completed_sessions: number;
  today_visits: number;
}

const TILES: [keyof Summary, string][] = [
  ['total_users', 'Total Users'],
  ['active_users', 'Active Users'],
  ['currently_tracking', 'Tracking Now'],
  ['location_unavailable', 'Location Issues'],
  ['today_punch_ins', 'Punch-ins Today'],
  ['today_punch_outs', 'Punch-outs Today'],
  ['completed_sessions', 'Completed Sessions'],
  ['today_visits', 'Visits Today'],
];

export default function Overview() {
  const { user, logout } = useAuth();
  const [s, setS] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      api.get<Summary>('/admin/summary/').then((r) => setS(r.data)).catch((e) => setError(errorMessage(e)));
    }, []),
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <Header title="Command Center" sub={`${user?.full_name || user?.username} · ${user?.role}`} />
      <ScrollView contentContainerStyle={styles.grid}>
        {error ? <Text style={{ color: '#dc2626' }}>{error}</Text> : null}
        {!s && !error ? <ActivityIndicator color="#0088ff" /> : null}
        {s &&
          TILES.map(([k, label]) => (
            <View key={k} style={styles.tile}>
              <Text style={styles.value}>{s[k]}</Text>
              <Text style={styles.label}>{label}</Text>
            </View>
          ))}
      </ScrollView>
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={{ color: '#dc2626', fontWeight: '700' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  tile: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  value: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  label: { fontSize: 12, color: '#64748b', marginTop: 4 },
  logout: { margin: 16, backgroundColor: '#fee2e2', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
});
