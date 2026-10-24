import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnDuty } from '../duty';
import { useAuth } from '../hooks/useAuth';
import { useT } from '../i18n';

export const initials = (name: string) => {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return (p.length > 1 ? p[0][0] + p[p.length - 1][0] : (p[0] ?? '?').slice(0, 2)).toUpperCase();
};

export default function AppHeader() {
  const { user } = useAuth();
  const { t } = useT();
  const onDuty = useOnDuty();
  const insets = useSafeAreaInsets();
  const name = user?.full_name || user?.username || '';
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <View>
          <Text style={styles.name}>
            {name} <Text style={{ color: '#10b981' }}>●</Text>
          </Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={[styles.badge, onDuty && styles.badgeOn]}>
        <Text style={[styles.badgeText, onDuty && { color: '#047857' }]}>● {onDuty ? t('onDuty') : t('offDuty')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00c696', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  name: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  date: { fontSize: 11, color: '#64748b' },
  badge: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f1f5f9', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeOn: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
});
