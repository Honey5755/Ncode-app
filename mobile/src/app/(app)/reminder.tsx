import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Back from '../../components/Back';
import { useT } from '../../i18n';

const KEY = 'ncode_punch_reminder';

export default function Reminder() {
  const { t } = useT();
  const [on, setOn] = useState(false);
  const [time, setTime] = useState('09:00');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => {
        if (!v) return;
        const s = JSON.parse(v);
        setOn(!!s.on);
        setTime(s.time ?? '09:00');
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
    if (!m) return setMsg('Enter time as HH:MM (24-hour).');
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (on) {
        const perm = await Notifications.requestPermissionsAsync();
        if (!perm.granted) return setMsg('Notification permission was denied.');
        // ponytail: daily local notification (fires even if already punched in); no server-side logic
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Time to punch in', body: 'Open Ncode Field to start your shift.' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: Number(m[1]), minute: Number(m[2]) },
        });
      }
      await SecureStore.setItemAsync(KEY, JSON.stringify({ on, time: `${m[1].padStart(2, '0')}:${m[2]}` }));
      setMsg(on ? `Reminder set for ${m[1].padStart(2, '0')}:${m[2]} daily.` : 'Reminder turned off.');
    } catch (e) {
      setMsg(`Could not schedule: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Back title={t('punchReminder')} sub="Notification alert" />
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.label}>Remind me to punch in</Text>
          <Switch value={on} onValueChange={setOn} />
        </View>
        <TextInput style={[s.input, !on && { opacity: 0.4 }]} editable={on} value={time} onChangeText={setTime} placeholder="09:00" keyboardType="numbers-and-punctuation" />
        {msg ? <Text style={s.msg}>{msg}</Text> : null}
        <TouchableOpacity style={s.btn} onPress={save}>
          <Text style={s.btnText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#334155' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 18, color: '#0f172a' },
  msg: { fontSize: 12, color: '#64748b' },
  btn: { backgroundColor: '#00c696', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
