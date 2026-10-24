import { ReactNode, useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { initials } from '../../components/AppHeader';
import { useAuth } from '../../hooks/useAuth';
import { useT } from '../../i18n';
import api, { unwrapList } from '../../services/api';
import type { LeaveRequest, Session } from '../../types';

type Href = '/history' | '/leave' | '/holidays' | '/notes' | '/route' | '/hr' | '/documents' | '/announcements' | '/password' | '/language' | '/reminder';

const ANNUAL_LEAVE_DAYS = 40; // ponytail: fixed quota, no backend policy yet
export const ANNOUNCEMENT_COUNT = 3; // matches the static list in announcements.tsx

function Tile({ icon, title, sub, href, badge, danger, onPress }: { icon: string; title: string; sub: string; href?: Href; badge?: string; danger?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.tile, danger && { borderColor: '#fecdd3' }]} onPress={onPress ?? (() => router.push(href! as never))}>
      <View style={[styles.tileIcon, danger && { backgroundColor: '#fff1f2' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.tileTitle, danger && { color: '#e11d48' }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.tileSub, danger && { color: '#fb7185' }]} numberOfLines={1}>{sub}</Text>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const Section = ({ title, children, full }: { title: string; children: ReactNode; full?: boolean }) => (
  <View style={{ marginBottom: 18 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={[styles.grid, full && { flexDirection: 'column' }]}>{children}</View>
  </View>
);

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useT();
  const [history, setHistory] = useState<Session[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get('/attendance/history/').then((r) => setHistory(unwrapList<Session>(r.data))).catch(() => {});
      api.get('/attendance/leaves/').then((r) => setLeaves(unwrapList<LeaveRequest>(r.data))).catch(() => {});
    }, []),
  );

  const name = user?.full_name || user?.username || '';
  const p = user?.profile;
  const now = new Date();
  const monthDays = new Set(
    history.filter((s) => { const d = new Date(s.punch_in_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).map((s) => new Date(s.punch_in_at).toDateString()),
  ).size;
  const used = leaves.filter((l) => l.status === 'APPROVED').reduce((n, l) => n + Math.round((+new Date(l.end_date) - +new Date(l.start_date)) / 864e5) + 1, 0);
  const last = [...history].sort((a, b) => +new Date(b.punch_in_at) - +new Date(a.punch_in_at))[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.role}>{p?.designation || 'Field Officer'}</Text>
          <Text style={styles.meta}>ID: {p?.employee_id || user?.username}</Text>
          <Text style={styles.meta} numberOfLines={1}>{p?.department || '—'}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        {[
          [t('thisMonth'), String(monthDays), t('daysPresent'), '#059669'],
          [t('leaveBalance'), String(Math.max(0, ANNUAL_LEAVE_DAYS - used)), t('daysAvailable'), '#d97706'],
          [t('lastPunch'), last ? new Date(last.punch_in_at).toLocaleDateString() : t('none'), last ? new Date(last.punch_in_at).toLocaleTimeString() : '', '#0f172a'],
        ].map(([label, val, cap, color]) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
            <Text style={[styles.statVal, { color }]} numberOfLines={1} adjustsFontSizeToFit>{val}</Text>
            <Text style={styles.statCap} numberOfLines={1}>{cap}</Text>
          </View>
        ))}
      </View>

      <Section title={t('myWork')}>
        <Tile icon="🗓" title={t('viewAttendance')} sub="Calendar & logs" href="/history" />
        <Tile icon="📝" title={t('requestLeave')} sub="Apply & balance" href="/leave" />
        <Tile icon="🎉" title={t('holidayList')} sub="Gazetted dates" href="/holidays" />
        <Tile icon="🗒" title={t('notes')} sub="Personal memos" href="/notes" />
        <Tile icon="🧭" title={t('myRoute')} sub="GPS trail & map" href="/route" />
      </Section>
      <Section title={t('myHr')}>
        <Tile icon="🪪" title={t('hrProfile')} sub="Official records" href="/hr" />
        <Tile icon="📁" title={t('myDocuments')} sub="Vault & files" href="/documents" />
      </Section>
      <Section title={t('updates')} full>
        <Tile icon="🔔" title={t('announcements')} sub="Official bulletins & updates" href="/announcements" badge={`${ANNOUNCEMENT_COUNT} NEW`} />
      </Section>
      <Section title={t('account')}>
        <Tile icon="🔑" title={t('password')} sub="Change login key" href="/password" />
        <Tile icon="🌐" title={t('language')} sub="EN / HI / GJ" href="/language" />
        <Tile icon="⏰" title={t('punchReminder')} sub="Notification alert" href="/reminder" />
        <Tile danger icon="⎋" title={t('logout')} sub="Exit application" onPress={() => { logout(); router.replace('/login'); }} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 14 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#00c696', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#d1fae5' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  role: { fontSize: 13, fontWeight: '700', color: '#059669' },
  meta: { fontSize: 11, color: '#64748b', marginTop: 1 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },
  statVal: { fontSize: 20, fontWeight: '800', marginVertical: 4 },
  statCap: { fontSize: 10, color: '#64748b' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  tileSub: { fontSize: 10, color: '#94a3b8' },
  badge: { backgroundColor: '#f43f5e', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
