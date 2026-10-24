import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Back from '../../components/Back';
import { useAuth } from '../../hooks/useAuth';
import { useT } from '../../i18n';

export default function HrProfile() {
  const { user } = useAuth();
  const { t } = useT();
  const p = user?.profile;
  const rows: [string, string | null | undefined][] = [
    ['Name', user?.full_name || user?.username],
    ['Employee ID', p?.employee_id || user?.username],
    ['Designation', p?.designation],
    ['Department', p?.department],
    ['ESIC Number', p?.esic_number],
    ['Email', user?.email],
    ['Phone', user?.phone],
    ['System Role', user?.role],
    ['Reports To', p?.reports_to?.name],
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16 }}>
      <Back title={t('hrProfile')} sub="Official records" />
      <View style={s.card}>
        {rows.map(([k, v], i) => (
          <View key={k} style={[s.row, i > 0 && s.border]}>
            <Text style={s.k}>{k}</Text>
            <Text style={s.v}>{v || '—'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, gap: 12 },
  border: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  k: { color: '#64748b', fontSize: 13 },
  v: { color: '#0f172a', fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
});
