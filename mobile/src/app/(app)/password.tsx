import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Back from '../../components/Back';
import { useT } from '../../i18n';
import api, { errorMessage } from '../../services/api';

export default function Password() {
  const { t } = useT();
  const [old, setOld] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (next !== again) return setMsg({ ok: false, text: 'New passwords do not match.' });
    try {
      await api.post('/auth/change-password/', { old_password: old, new_password: next });
      setOld('');
      setNext('');
      setAgain('');
      setMsg({ ok: true, text: 'Password changed.' });
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Back title={t('password')} sub="Change login key" />
      <View style={s.card}>
        {([['Current password', old, setOld], ['New password', next, setNext], ['Confirm new password', again, setAgain]] as const).map(([ph, v, set]) => (
          <TextInput key={ph} style={s.input} placeholder={ph} placeholderTextColor="#94a3b8" secureTextEntry value={v} onChangeText={set} autoCapitalize="none" />
        ))}
        {msg ? <Text style={{ color: msg.ok ? '#059669' : '#dc2626', fontSize: 12 }}>{msg.text}</Text> : null}
        <TouchableOpacity style={s.btn} onPress={submit}>
          <Text style={s.btnText}>Change password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#0f172a' },
  btn: { backgroundColor: '#00c696', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
