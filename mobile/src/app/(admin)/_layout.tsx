import { Tabs } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { can } from '../../services/permissions';

const TABS = [
  { name: 'overview', title: 'Command', screen: 'dashboard' },
  { name: 'map', title: 'Live Map', screen: 'dashboard' },
  { name: 'attendance', title: 'Attendance', screen: 'attendance.sessions' },
  { name: 'leaves', title: 'Leaves', screen: 'attendance.leaves' },
  { name: 'users', title: 'Users', screen: 'user_management.user' },
];

export default function AdminTabsLayout() {
  const { user } = useAuth();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0088ff', tabBarInactiveTintColor: '#94a3b8' }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, href: can(user, t.screen) ? undefined : null }} />
      ))}
    </Tabs>
  );
}
