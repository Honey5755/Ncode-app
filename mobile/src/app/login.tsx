import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { errorMessage } from '../services/api';

const BLUE = '#0088ff';

type LoginRole = 'staff' | 'admin' | 'manager';
const ROLES: LoginRole[] = ['staff', 'admin', 'manager'];
const COPY: Record<LoginRole, { label: string; eyebrow: string; heading: string; helper: string; expected: string }> = {
  staff: {
    label: 'Staff Login',
    eyebrow: 'Staff access',
    heading: 'Welcome, Field Officer',
    helper: 'Sign in to manage attendance, field visits, and tracking.',
    expected: 'USER',
  },
  admin: {
    label: 'Admin Login',
    eyebrow: 'Administrator access',
    heading: 'Welcome, Administrator',
    helper: 'Sign in to manage operations, users, and reports.',
    expected: 'ADMIN',
  },
  manager: {
    label: 'Manager Login',
    eyebrow: 'Manager access',
    heading: 'Welcome, Manager',
    helper: 'Sign in to review the areas assigned to your role.',
    expected: 'MANAGER',
  },
};
const ICON: Record<LoginRole, string> = { staff: '👤', admin: '🛡️', manager: '👥' };

export default function LoginScreen() {
  const { login, logout } = useAuth();
  const [role, setRole] = useState<LoginRole>('staff');
  const [menuOpen, setMenuOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const copy = COPY[role];

  const signIn = async (id: string, pass: string, expected = copy.expected) => {
    setBusy(true);
    setError('');
    try {
      const u = await login(id, pass);
      if (u.role !== expected) {
        logout();
        throw new Error(`This account is not valid for ${copy.label}.`);
      }
      // Root layout guards route staff to (app) and admin/manager to (admin).
    } catch (err) {
      setError(errorMessage(err) || 'Authentication failed. Please verify your credentials.');
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (identifier.trim() && password) signIn(identifier.trim(), password);
  };

  return (
    <ImageBackground source={require('../../assets/ncode_bg.jpg')} style={styles.screen} resizeMode="cover">
      <View style={styles.overlay} />
      <View style={styles.switcher}>
        <TouchableOpacity style={styles.switchBtn} onPress={() => setMenuOpen(!menuOpen)} accessibilityLabel="Choose login portal">
          <Text style={{ fontSize: 20 }}>{ICON[role]}</Text>
        </TouchableOpacity>
        {menuOpen && (
          <View style={styles.menu}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.menuItem, role === r && { backgroundColor: BLUE }]}
                onPress={() => {
                  setRole(r);
                  setMenuOpen(false);
                  setError('');
                }}
              >
                <Text style={{ fontSize: 16 }}>{ICON[r]}</Text>
                <Text style={{ fontWeight: '600', color: role === r ? '#fff' : '#475569' }}>{COPY[r].label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <Text style={styles.logoN}>(n)</Text>
            <View>
              <Text style={styles.logoText}>Code<Text style={styles.reg}>®</Text></Text>
              <Text style={styles.logoSub}>SOLUTIONS</Text>
            </View>
          </View>
          <Text style={styles.h1}>Field Force Platform</Text>
          <Text style={styles.lead}>
            Enterprise management for live attendance, tracking, and remote field operations.
          </Text>

          <View style={styles.card}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.heading}</Text>
            <Text style={styles.subtitle}>{copy.helper}</Text>

            <Text style={styles.label}>Enter your username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Login ID"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
            />

            <Text style={styles.label}>Enter your Password</Text>
            <View>
              <TextInput
                style={[styles.input, { paddingRight: 56 }]}
                placeholder="Enter Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.show} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reset}
              onPress={() => {
                setIdentifier('');
                setPassword('');
                setError('');
              }}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            {role === 'staff' && (
              <>
                <View style={styles.divider} />
                {(
                  [
                    ['Admin Portal', 'admin@honey.com', '123456', 'ADMIN'],
                    ['Field Officer Portal', 'staff@honey.com', '123456', 'USER'],
                    ['Manager Portal', 'manager@honey.com', '123456', 'MANAGER'],
                  ] as const
                ).map(([label, id, pass, exp]) => (
                  <TouchableOpacity key={id} style={styles.direct} onPress={() => signIn(id, pass, exp)} disabled={busy}>
                    <Text style={styles.buttonText}>Direct Login ({label})</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a192f' },
  overlay: { ...StyleSheet.absoluteFill as object, backgroundColor: 'rgba(15,23,42,0.6)' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 60 },
  logoBox: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 24,
    gap: 6,
  },
  logoN: { color: '#0088cc', fontWeight: '700', fontSize: 16, borderWidth: 2, borderColor: '#0088cc', borderRadius: 20, paddingHorizontal: 6 },
  logoText: { color: '#0088cc', fontWeight: '700', fontSize: 22 },
  reg: { fontSize: 9 },
  logoSub: { color: '#94a3b8', fontSize: 9, letterSpacing: 1 },
  h1: { color: '#fff', fontSize: 32, fontWeight: '300', marginBottom: 8 },
  lead: { color: '#cbd5e1', fontSize: 15, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  eyebrow: { color: BLUE, fontWeight: '600', fontSize: 13, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 6, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  show: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 12 },
  showText: { color: BLUE, fontSize: 12 },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 8, borderRadius: 4, marginTop: 14, fontSize: 12 },
  button: { backgroundColor: BLUE, borderRadius: 4, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  reset: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  resetText: { color: '#475569', fontWeight: '600', fontSize: 15 },
  divider: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 16 },
  switcher: { position: 'absolute', top: 50, right: 16, zIndex: 20, alignItems: 'flex-end' },
  switchBtn: { width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  menu: { marginTop: 8, backgroundColor: '#fff', borderRadius: 8, padding: 6, gap: 4 },
  menuItem: { minWidth: 150, height: 40, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  direct: { backgroundColor: '#334155', borderRadius: 4, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
});
