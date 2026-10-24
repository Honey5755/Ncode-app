import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

export default function Back({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={() => router.navigate('/profile')} accessibilityLabel="Back">
        <Text style={styles.chev}>‹</Text>
      </TouchableOpacity>
      <View>
        <Text style={styles.title}>{title}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  chev: { fontSize: 22, color: '#334155', marginTop: -2 },
  title: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 11, color: '#64748b' },
});
