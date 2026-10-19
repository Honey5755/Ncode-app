import { ReactNode, useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api, { errorMessage, unwrapList } from '../services/api';

export function Header({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      {children}
    </View>
  );
}

export function Pill({ text, color = '#64748b', bg = '#f1f5f9' }: { text: string; color?: string; bg?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

// Fetches `url` (array or paginated) on focus and renders each row with `renderItem`.
export default function AdminList<T extends { id?: number }>({
  url,
  params,
  renderItem,
  header,
  empty = 'Nothing to show.',
  reloadKey,
}: {
  url: string;
  params?: object;
  renderItem: (item: T, reload: () => void) => ReactNode;
  header?: ReactNode;
  empty?: string;
  reloadKey?: string;
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setRows(unwrapList<T>((await api.get(url, { params })).data));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {header}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#0088ff" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r, i) => String(r.id ?? i)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>{empty}</Text>}
          renderItem={({ item }) => <View style={styles.card}>{renderItem(item, load)}</View>}
        />
      )}
    </View>
  );
}

export const cardStyles = StyleSheet.create({
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  err: { color: '#dc2626', padding: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
