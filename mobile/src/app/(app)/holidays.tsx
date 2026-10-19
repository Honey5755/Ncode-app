import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import api, { errorMessage, unwrapList } from '../../services/api';
import type { Holiday } from '../../types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function HolidaysScreen() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/attendance/holidays/');
      const list = unwrapList<Holiday>(r.data).sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(list);
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

  const groups: { month: string; items: Holiday[] }[] = [];
  for (const h of holidays) {
    const d = new Date(h.date);
    const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    const group = groups.find((g) => g.month === key);
    if (group) group.items.push(h);
    else groups.push({ month: key, items: [h] });
  }

  if (loading && holidays.length === 0) {
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Holiday List</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {groups.length === 0 ? (
        <Text style={styles.empty}>No holidays configured.</Text>
      ) : (
        groups.map((g) => (
          <View key={g.month} style={styles.card}>
            <Text style={styles.monthTitle}>{g.month}</Text>
            {g.items.map((h, i) => (
              <View key={h.id} style={[styles.row, i === g.items.length - 1 && { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={styles.rowText}>{h.name}</Text>
                  <Text style={styles.sub}>{h.date}</Text>
                </View>
                {h.is_mandatory ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Mandatory</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  backRow: { marginBottom: 12 },
  backText: { color: '#00c696', fontSize: 14, fontWeight: '600' },
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
  monthTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  sub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  badge: { backgroundColor: '#fffbeb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#d97706' },
});
