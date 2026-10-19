import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import api, { errorMessage, unwrapList } from '../../services/api';
import { requestTrackingPermissions, startTracking, stopTracking, getCurrentPoint } from '../../services/tracking';
import { useAuth } from '../../hooks/useAuth';
import type { Session } from '../../types';

function formatShortDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function trackingBadge(status?: string) {
  if (status === 'ACTIVE') return { bg: '#ecfdf5', fg: '#16a34a', label: 'Tracking active' };
  if (status === 'PAUSED') return { bg: '#fffbeb', fg: '#d97706', label: 'Tracking paused' };
  if (status === 'PUNCHED_OUT') return { bg: '#f1f5f9', fg: '#64748b', label: 'Punched out' };
  // LOCATION_UNAVAILABLE, PERMISSION_DENIED, OFFLINE — all read as an obvious problem state.
  return { bg: '#fef2f2', fg: '#dc2626', label: `Tracking paused — ${status ?? 'unknown'}` };
}

function sessionBadge(status: Session['status']) {
  return status === 'ACTIVE' ? { bg: '#ecfdf5', fg: '#16a34a' } : { bg: '#f1f5f9', fg: '#64748b' };
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const [curRes, historyRes] = await Promise.all([
        api.get('/attendance/current/'),
        api.get('/attendance/history/').catch(() => null),
      ]);
      setSession(curRes.data.session ?? null);
      if (historyRes) {
        const list = unwrapList<Session>(historyRes.data);
        list.sort((a, b) => new Date(b.punch_in_at).getTime() - new Date(a.punch_in_at).getTime());
        setRecentSessions(list.slice(0, 3));
      }
      if (curRes.data.session?.status === 'ACTIVE') {
        const perm = await requestTrackingPermissions();
        if (perm.granted) await startTracking();
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCurrent();
    }, [loadCurrent]),
  );

  useEffect(() => {
    if (session?.status !== 'ACTIVE') return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session?.status]);

  const punchIn = async () => {
    setError('');
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      setError('Camera permission is required to punch in.');
      return;
    }
    const photo = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (photo.canceled) return;
    const asset = photo.assets[0];

    setBusy(true);
    try {
      const point = await getCurrentPoint();
      const form = new FormData();
      form.append('selfie', {
        uri: asset.uri,
        name: 'selfie.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob);
      form.append('latitude', String(point.latitude));
      form.append('longitude', String(point.longitude));
      if (point.accuracy != null) form.append('accuracy', String(point.accuracy));

      const r = await api.post('/attendance/punch-in/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSession(r.data);

      const perm = await requestTrackingPermissions();
      if (perm.granted) {
        await startTracking();
      } else {
        Alert.alert('Limited tracking', perm.reason ?? 'Background location was not granted.');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const punchOut = async () => {
    setError('');
    setBusy(true);
    try {
      let point: { latitude: number; longitude: number; accuracy?: number | null } | null = null;
      try {
        point = await getCurrentPoint();
      } catch {
        // final location is optional on punch-out
      }
      const r = await api.post('/attendance/punch-out/', point ?? {});
      setSession(r.data);
      await stopTracking();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00c696" />
      </View>
    );
  }

  const isActive = session?.status === 'ACTIVE';
  const duration = isActive ? (session?.duration_seconds ?? 0) + tick : session?.duration_seconds ?? 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadCurrent} />}
    >
      <Text style={styles.greeting}>Hi, {user?.full_name || user?.username}</Text>
      <Text style={styles.subGreeting}>{user?.profile?.designation || 'Field Officer'}</Text>

      <View style={[styles.statusCard, isActive ? styles.statusActive : styles.statusInactive]}>
        <Text style={styles.statusLabel}>{isActive ? 'ON DUTY' : 'OFF DUTY'}</Text>
        {isActive ? (
          <>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
            {(() => {
              const tb = trackingBadge(session?.tracking_status);
              return (
                <View style={[styles.trackingBadge, { backgroundColor: tb.bg }]}>
                  <Text style={[styles.trackingBadgeText, { color: tb.fg }]}>{tb.label}</Text>
                </View>
              );
            })()}
            <Text style={styles.statusSub}>
              Since {session?.punch_in_at ? new Date(session.punch_in_at).toLocaleTimeString() : '—'}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.selfiePlaceholder}>
              <View style={styles.selfieLensOuter}>
                <View style={styles.selfieLensInner} />
              </View>
            </View>
            <Text style={[styles.statusSub, styles.statusSubCentered]}>
              Selfie and location are captured when you punch in.
            </Text>
          </>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.actionButton, isActive ? styles.punchOutButton : styles.punchInButton]}
        onPress={isActive ? punchOut : punchIn}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionButtonText}>{isActive ? 'Punch Out' : 'Punch In'}</Text>
        )}
      </TouchableOpacity>

      {isActive && (
        <Text style={styles.hint}>Keep the app installed and background location allowed so tracking continues.</Text>
      )}

      {session ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Shift</Text>
          <View style={styles.shiftRow}>
            <Text style={styles.shiftLabel}>Logged Hours</Text>
            <Text style={styles.shiftValue}>{formatShortDuration(duration)}</Text>
          </View>
          <View style={styles.shiftRow}>
            <Text style={styles.shiftLabel}>In</Text>
            <Text style={styles.shiftValue}>
              {session.punch_in_at ? new Date(session.punch_in_at).toLocaleTimeString() : '—'}
            </Text>
          </View>
          <View style={styles.shiftRow}>
            <Text style={styles.shiftLabel}>Out</Text>
            <Text style={styles.shiftValue}>
              {session.punch_out_at ? new Date(session.punch_out_at).toLocaleTimeString() : '—'}
            </Text>
          </View>
          <View style={[styles.shiftRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.shiftLabel}>GPS</Text>
            {(() => {
              const tb = trackingBadge(session.tracking_status);
              return (
                <View style={[styles.trackingBadge, { backgroundColor: tb.bg }]}>
                  <Text style={[styles.trackingBadgeText, { color: tb.fg }]}>{tb.label}</Text>
                </View>
              );
            })()}
          </View>
        </View>
      ) : null}

      {recentSessions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Attendance</Text>
          {recentSessions.map((s, i) => {
            const b = sessionBadge(s.status);
            return (
              <View key={s.id} style={[styles.recentRow, i === recentSessions.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.shiftLabel}>
                  {new Date(s.punch_in_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.shiftValue}>{formatShortDuration(s.duration_seconds)}</Text>
                <View style={[styles.recentBadge, { backgroundColor: b.bg }]}>
                  <Text style={[styles.recentBadgeText, { color: b.fg }]}>{s.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subGreeting: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statusActive: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#34d399' },
  statusInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  statusLabel: { fontSize: 12, fontWeight: '700', color: '#00c696', marginBottom: 8, letterSpacing: 1 },
  durationText: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  statusSub: { fontSize: 13, color: '#475569' },
  statusSubCentered: { textAlign: 'center' },
  selfiePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selfieLensOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieLensInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#94a3b8' },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  punchInButton: { backgroundColor: '#00c696' },
  punchOutButton: { backgroundColor: '#dc2626' },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 12, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shiftLabel: { fontSize: 13, color: '#64748b' },
  shiftValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  trackingBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 6 },
  trackingBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recentBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  recentBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});
