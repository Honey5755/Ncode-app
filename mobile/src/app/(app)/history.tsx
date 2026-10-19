import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api, { errorMessage, unwrapList } from '../../services/api';
import type { Session } from '../../types';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/attendance/history/');
      const list = unwrapList<Session>(r.data);
      list.sort((a, b) => new Date(b.punch_in_at).getTime() - new Date(a.punch_in_at).getTime());
      setSessions(list);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && sessions.length === 0) {
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
      <Text style={styles.title}>Attendance History</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {sessions.length === 0 ? (
        <Text style={styles.empty}>No past sessions yet.</Text>
      ) : (
        sessions.map((s) => {
          const date = new Date(s.punch_in_at);
          const isActive = s.status === 'ACTIVE';
          return (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>
                  {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeDone]}>
                  <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextDone]}>{s.status}</Text>
                </View>
              </View>
              <Text style={styles.row}>
                In: {date.toLocaleTimeString()}
                {s.punch_out_at ? `   Out: ${new Date(s.punch_out_at).toLocaleTimeString()}` : ''}
              </Text>
              <Text style={styles.row}>Duration: {formatDuration(s.duration_seconds)}</Text>
              <Text style={styles.sub}>Tracking: {s.tracking_status}</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 20 },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: '#ecfdf5' },
  badgeDone: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  badgeTextActive: { color: '#16a34a' },
  badgeTextDone: { color: '#64748b' },
  row: { fontSize: 13, color: '#475569', marginBottom: 4 },
  sub: { fontSize: 12, color: '#94a3b8' },
});
