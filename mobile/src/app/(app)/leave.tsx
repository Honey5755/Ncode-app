import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api, { errorMessage, unwrapList } from '../../services/api';
import type { Holiday, LeaveRequest, LeaveStatus, LeaveType } from '../../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'CASUAL', label: 'Casual' },
  { value: 'SICK', label: 'Sick' },
  { value: 'PTO', label: 'PTO' },
];

function statusColors(status: LeaveStatus) {
  switch (status) {
    case 'APPROVED':
      return { bg: '#ecfdf5', fg: '#16a34a' };
    case 'REJECTED':
      return { bg: '#fef2f2', fg: '#dc2626' };
    default:
      return { bg: '#fffbeb', fg: '#d97706' };
  }
}

export default function LeaveScreen() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [leavesRes, holidaysRes] = await Promise.all([api.get('/attendance/leaves/'), api.get('/attendance/holidays/')]);
      const list = unwrapList<LeaveRequest>(leavesRes.data);
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLeaves(list);

      const today = new Date().toISOString().slice(0, 10);
      const upcoming = unwrapList<Holiday>(holidaysRes.data)
        .filter((h) => h.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
      setHolidays(upcoming);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submit = async () => {
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      setFormError('Enter both dates as YYYY-MM-DD.');
      return;
    }
    if (startDate > endDate) {
      setFormError('Start date must be on or before end date.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Reason is required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/attendance/leaves/', {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      setStartDate('');
      setEndDate('');
      setReason('');
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && leaves.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00c696" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <Text style={styles.title}>Leave</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New Request</Text>

        <Text style={styles.label}>Leave Type</Text>
        <View style={styles.segmentRow}>
          {LEAVE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.segment, leaveType === t.value && styles.segmentActive]}
              onPress={() => setLeaveType(t.value)}
            >
              <Text style={[styles.segmentText, leaveType === t.value && styles.segmentTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Reason for leave"
          placeholderTextColor="#94a3b8"
          value={reason}
          onChangeText={setReason}
          multiline
        />

        {formError ? <Text style={styles.error}>{formError}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Request</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Requests</Text>
      {leaves.length === 0 ? (
        <Text style={styles.empty}>No leave requests yet.</Text>
      ) : (
        leaves.map((l) => {
          const colors = statusColors(l.status);
          return (
            <View key={l.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.leaveType}>{l.leave_type}</Text>
                <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.badgeText, { color: colors.fg }]}>{l.status}</Text>
                </View>
              </View>
              <Text style={styles.row}>
                {l.start_date} → {l.end_date}
              </Text>
              {l.reason ? (
                <>
                  <Text style={styles.fieldLabel}>Reason</Text>
                  <Text style={styles.sub}>{l.reason}</Text>
                </>
              ) : null}
            </View>
          );
        })
      )}

      {holidays.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
          <View style={styles.card}>
            {holidays.map((h, i) => (
              <View key={h.id} style={[styles.holidayRow, i === holidays.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.row}>{h.name}</Text>
                <Text style={styles.sub}>{h.date}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 8, marginBottom: 12 },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginVertical: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 10 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: '#00c696', borderColor: '#00c696' },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  segmentTextActive: { color: '#fff' },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#00c696', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  leaveType: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { fontSize: 13, color: '#475569' },
  sub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  holidayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
});
