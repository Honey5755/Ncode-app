import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import api, { errorMessage, unwrapList } from '../../services/api';
import type { EmployeeNote } from '../../types';

export default function NotesScreen() {
  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/attendance/notes/');
      const list = unwrapList<EmployeeNote>(r.data).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setNotes(list);
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

  const addNote = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/attendance/notes/', { content: content.trim() });
      setContent('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = (note: EmployeeNote) => {
    Alert.alert('Delete note', 'This note will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(note.id);
          try {
            await api.delete(`/attendance/notes/${note.id}/`);
            await load();
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  if (loading && notes.length === 0) {
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Notes</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write a note..."
          placeholderTextColor="#94a3b8"
          value={content}
          onChangeText={setContent}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={addNote} disabled={submitting || !content.trim()}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Note</Text>}
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <Text style={styles.empty}>No notes yet.</Text>
      ) : (
        notes.map((n) => (
          <View key={n.id} style={styles.card}>
            <Text style={styles.noteContent}>{n.content}</Text>
            <View style={styles.noteFooter}>
              <Text style={styles.sub}>{new Date(n.created_at).toLocaleString()}</Text>
              <TouchableOpacity onPress={() => deleteNote(n)} disabled={deletingId === n.id}>
                {deletingId === n.id ? (
                  <ActivityIndicator color="#dc2626" size="small" />
                ) : (
                  <Text style={styles.deleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  backRow: { marginBottom: 12 },
  backText: { color: '#00c696', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  error: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 },
  empty: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 20 },
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
  button: { backgroundColor: '#00c696', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  noteContent: { fontSize: 14, color: '#0f172a', marginBottom: 8 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sub: { fontSize: 12, color: '#94a3b8' },
  deleteText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
});
