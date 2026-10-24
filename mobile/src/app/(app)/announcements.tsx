import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Back from '../../components/Back';
import { useT } from '../../i18n';

// ponytail: static sample items; replace with a backend feed when announcements exist
const ITEMS = [
  { id: 1, title: 'Attendance policy v1.0', body: 'Punch in with a selfie and GPS lock at the start of every field shift.', date: '2026-10-01' },
  { id: 2, title: 'Festival holiday list published', body: 'Check the Holiday List for the gazetted dates this quarter.', date: '2026-10-10' },
  { id: 3, title: 'App update', body: 'New Language and Punch Reminder settings are available in Profile.', date: '2026-10-18' },
];

export default function Announcements() {
  const { t } = useT();
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16 }}>
      <Back title={t('announcements')} />
      {ITEMS.map((a) => (
        <View key={a.id} style={s.card}>
          <View style={s.row}>
            <Text style={s.title}>{a.title}</Text>
            <Text style={s.date}>{new Date(a.date).toLocaleDateString()}</Text>
          </View>
          <Text style={s.body}>{a.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { fontWeight: '800', color: '#0f172a', flex: 1 },
  date: { fontSize: 11, color: '#94a3b8' },
  body: { fontSize: 12, color: '#64748b', marginTop: 4 },
});
