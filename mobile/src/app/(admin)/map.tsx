import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { Header } from '../../components/AdminList';
import api, { unwrapList } from '../../services/api';

interface Live {
  session_id: number;
  display_name: string;
  tracking_status: string;
  latitude: number | null;
  longitude: number | null;
}

export default function LiveMap() {
  const [pts, setPts] = useState<Live[]>([]);

  // ponytail: polls on focus + every 15s; the web uses a WebSocket feed.
  useFocusEffect(
    useCallback(() => {
      const load = () =>
        api.get('/admin/live/').then((r) => setPts(unwrapList<Live>(r.data).filter((p) => p.latitude != null))).catch(() => {});
      load();
      const t = setInterval(load, 15000);
      return () => clearInterval(t);
    }, []),
  );

  const first = pts[0];
  return (
    <View style={{ flex: 1 }}>
      <Header title="Live Map" sub={`${pts.length} on the field`} />
      {first ? (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{ latitude: Number(first.latitude), longitude: Number(first.longitude), latitudeDelta: 0.5, longitudeDelta: 0.5 }}
        >
          {pts.map((p) => (
            <Marker
              key={p.session_id}
              coordinate={{ latitude: Number(p.latitude), longitude: Number(p.longitude) }}
              title={p.display_name}
              description={p.tracking_status}
            />
          ))}
        </MapView>
      ) : (
        <Text style={styles.empty}>No one is currently tracking.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ empty: { textAlign: 'center', color: '#64748b', marginTop: 40 } });
