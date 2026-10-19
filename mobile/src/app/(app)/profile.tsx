import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

const NAV_ROWS: { label: string; href: '/history' | '/leave' | '/holidays' | '/documents' | '/notes' }[] = [
  { label: 'View Attendance', href: '/history' },
  { label: 'Request Leave', href: '/leave' },
  { label: 'Holiday List', href: '/holidays' },
  { label: 'My Documents', href: '/documents' },
  { label: 'Notes', href: '/notes' },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const displayName = user?.full_name || user?.username || '';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatarHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials(displayName)}</Text>
        </View>
        <Text style={styles.avatarName}>{displayName}</Text>
        {user?.profile?.designation ? <Text style={styles.avatarRole}>{user.profile.designation}</Text> : null}
      </View>

      <View style={styles.card}>
        {NAV_ROWS.map((r) => (
          <TouchableOpacity key={r.href} style={styles.navRow} onPress={() => router.push(r.href)}>
            <Text style={styles.navRowText}>{r.label}</Text>
            <Text style={styles.navRowChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Row label="Name" value={user?.full_name || user?.username || ''} />
        <Row label="Employee ID" value={user?.profile?.employee_id || user?.username || ''} />
        <Row label="Department" value={user?.profile?.department || ''} />
        <Row label="Designation" value={user?.profile?.designation || ''} />
        <Row label="Email" value={user?.email || ''} />
        <Row label="Phone" value={user?.phone || '—'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reports To</Text>
        {user?.profile?.reports_to ? (
          <>
            <Text style={styles.managerName}>{user.profile.reports_to.name}</Text>
            <Text style={styles.managerRole}>{user.profile.reports_to.designation}</Text>
            <View style={styles.managerActions}>
              {user.profile.reports_to.phone ? (
                <TouchableOpacity
                  style={styles.managerAction}
                  onPress={() => Linking.openURL(`tel:${user!.profile!.reports_to!.phone}`)}
                >
                  <Text style={styles.managerActionText}>Call</Text>
                </TouchableOpacity>
              ) : null}
              {user.profile.reports_to.email ? (
                <TouchableOpacity
                  style={styles.managerAction}
                  onPress={() => Linking.openURL(`mailto:${user!.profile!.reports_to!.email}`)}
                >
                  <Text style={styles.managerActionText}>Email</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        ) : (
          <Text style={styles.rowValue}>Not assigned</Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  avatarHeader: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00c696',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  avatarName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  avatarRole: { fontSize: 13, color: '#64748b', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { color: '#64748b', fontSize: 13 },
  rowValue: { color: '#0f172a', fontSize: 13, fontWeight: '600' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  navRowText: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  navRowChevron: { color: '#94a3b8', fontSize: 18 },
  managerName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  managerRole: { fontSize: 13, color: '#64748b', marginTop: 2 },
  managerActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  managerAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00c696',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  managerActionText: { color: '#00c696', fontWeight: '700', fontSize: 13 },
  logoutButton: { marginTop: 8, backgroundColor: '#fee2e2', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontWeight: '700' },
});
