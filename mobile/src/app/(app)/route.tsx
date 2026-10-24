import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import api, { errorMessage, unwrapList } from '../../services/api';
import type { Session, Visit } from '../../types';

type Point = { latitude: number; longitude: number };

export default function RouteScreen() {
  const [path, setPath] = useState<Point[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const cur = await api.get<{ session: Session | null }>('/attendance/current/');
      const id = cur.data.session?.id;
      if (!id) {
        setPath([]);
        setVisits([]);
        return;
      }
      const [locs, v] = await Promise.all([
        api.get(`/locations/?session=${id}`),
        api.get('/attendance/visits/', { params: { session: id } }).catch(() => ({ data: [] })),
      ]);
      setPath(unwrapList<Point>(locs.data).map((p) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) })));
      setVisits(unwrapList<Visit>(v.data).filter((x) => x.latitude != null && x.longitude != null));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#00c696" />;

  const last = path[path.length - 1];
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Session Route</Text>
        <Text style={styles.sub}>{path.length} points tracked</Text>
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {last ? (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{ ...last, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
        >
          <Polyline coordinates={path} strokeColor="#00c696" strokeWidth={4} />
          <Marker coordinate={last} title="Current location" pinColor="#00c696" />
          {visits.map((v) => (
            <Marker
              key={v.id}
              coordinate={{ latitude: Number(v.latitude), longitude: Number(v.longitude) }}
              title={v.site_name}
              description={v.status}
            />
          ))}
        </MapView>
      ) : (
        <Text style={styles.empty}>Punch in to start recording your route.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  err: { color: '#dc2626', padding: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
