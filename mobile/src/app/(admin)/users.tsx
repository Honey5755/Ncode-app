import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import AdminList, { cardStyles as c, Header, Pill } from '../../components/AdminList';
import api, { errorMessage } from '../../services/api';

interface AUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  has_active_session: boolean;
  profile?: { employee_id?: string; department?: string };
}

export default function Users() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const toggle = async (u: AUser, value: boolean, reload: () => void) => {
    try {
      await api.patch(`/admin/users/${u.id}/`, { is_active: value });
      reload();
    } catch (e) {
      Alert.alert('Failed', errorMessage(e));
    }
  };

  return (
    <AdminList<AUser>
      url="/admin/users/"
      params={search ? { search } : undefined}
      reloadKey={search}
      header={
        <Header title="Employees & Users">
          <TextInput
            style={styles.input}
            placeholder="Search name, ID, department"
            placeholderTextColor="#94a3b8"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => setSearch(q.trim())}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </Header>
      }
      renderItem={(u, reload) => (
        <View style={c.row}>
          <View style={{ flex: 1 }}>
            <Text style={c.name}>{u.full_name || u.username}</Text>
            <Text style={c.meta}>{u.profile?.employee_id ?? u.username} · {u.profile?.department || u.role}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <Pill text={u.role} />
              {u.has_active_session ? <Pill text="ON FIELD" color="#16a34a" bg="#ecfdf5" /> : null}
            </View>
          </View>
          <Switch value={u.is_active} onValueChange={(v) => toggle(u, v, reload)} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  input: { marginTop: 10, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0f172a' },
});
