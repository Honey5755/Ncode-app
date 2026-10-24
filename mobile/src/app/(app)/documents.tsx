import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect } from 'expo-router';
import api, { API_URL, errorMessage } from '../../services/api';
import type { EmployeeDocument } from '../../types';

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/attendance/documents/');
      const list: EmployeeDocument[] = Array.isArray(r.data) ? r.data : [];
      list.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
      setDocuments(list);
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

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (result.canceled) return;
    setPickedFile(result.assets[0]);
    if (!name.trim()) setName(result.assets[0].name);
  };

  const upload = async () => {
    if (!name.trim() || !pickedFile) {
      setError('Pick a file and give it a name first.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('file', {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: pickedFile.mimeType || 'application/octet-stream',
      } as unknown as Blob);
      await api.post('/attendance/documents/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setName('');
      setPickedFile(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const openDocument = (doc: EmployeeDocument) => {
    const url = doc.file_url.startsWith('http') ? doc.file_url : `${API_ORIGIN}${doc.file_url}`;
    Linking.openURL(url).catch(() => setError('Could not open this document.'));
  };

  const deleteDocument = (doc: EmployeeDocument) => {
    Alert.alert('Delete document', `Delete "${doc.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(doc.id);
          try {
            await api.delete(`/attendance/documents/${doc.id}/`);
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

  if (loading && documents.length === 0) {
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
      <Text style={styles.title}>My Documents</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload Document</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Aadhaar Card"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
        />
        <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
          <Text style={styles.pickButtonText}>{pickedFile ? pickedFile.name : 'Choose File'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={upload} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload</Text>}
        </TouchableOpacity>
      </View>

      {documents.length === 0 ? (
        <Text style={styles.empty}>No documents uploaded yet.</Text>
      ) : (
        documents.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.docName}>{d.name}</Text>
            </View>
            <Text style={styles.sub}>Uploaded {new Date(d.uploaded_at).toLocaleDateString()}</Text>
            <View style={styles.formButtonRow}>
              <TouchableOpacity style={styles.openButton} onPress={() => openDocument(d)}>
                <Text style={styles.openButtonText}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteDocument(d)}
                disabled={deletingId === d.id}
              >
                {deletingId === d.id ? (
                  <ActivityIndicator color="#dc2626" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
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
  content: { padding: 20, paddingTop: 16 },
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  pickButton: {
    borderWidth: 1,
    borderColor: '#00c696',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  pickButtonText: { color: '#00c696', fontWeight: '600', fontSize: 13 },
  button: { backgroundColor: '#00c696', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docName: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1 },
  sub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  formButtonRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  openButton: { flex: 1, backgroundColor: '#00c696', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  openButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
});
