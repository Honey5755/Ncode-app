import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Back from '../../components/Back';
import { Lang, setLang, useT } from '../../i18n';

const OPTIONS: [Lang, string, string][] = [
  ['en', 'English', 'Standard business English'],
  ['hi', 'हिंदी', 'राजभाषा हिंदी'],
  ['gu', 'ગુજરાતી', 'સ્થાનિક ભાષા ગુજરાતી'],
];

export default function Language() {
  const { t, lang } = useT();
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16 }}>
      <Back title={t('language')} sub={t('chooseLanguage')} />
      <View style={s.card}>
        {OPTIONS.map(([code, label, sub], i) => (
          <TouchableOpacity key={code} style={[s.row, lang === code && { backgroundColor: '#ecfdf5' }, i > 0 && s.border]} onPress={() => setLang(code)}>
            <View>
              <Text style={s.label}>{label}</Text>
              <Text style={s.sub}>{sub}</Text>
            </View>
            {lang === code ? <Text style={s.check}>✓</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.note}>Menus and headings adapt to your selected language. Form content stays in English.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  row: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  border: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  label: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#059669', color: '#fff', textAlign: 'center', lineHeight: 26, fontWeight: '800' },
  note: { marginTop: 12, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 10, fontSize: 12, color: '#64748b' },
});
