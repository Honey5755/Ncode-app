import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabLabel({ children, focused }: { children: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: focused ? '700' : '500', color: focused ? '#00c696' : '#94a3b8' }}>
      {children}
    </Text>
  );
}

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00c696',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarLabel: ({ focused }) => <TabLabel focused={focused}>Home</TabLabel> }}
      />
      <Tabs.Screen
        name="visits"
        options={{ title: 'Visits', tabBarLabel: ({ focused }) => <TabLabel focused={focused}>Visits</TabLabel> }}
      />
      <Tabs.Screen
        name="route"
        options={{ title: 'Route', tabBarLabel: ({ focused }) => <TabLabel focused={focused}>Route</TabLabel> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarLabel: ({ focused }) => <TabLabel focused={focused}>History</TabLabel> }}
      />
      <Tabs.Screen
        name="leave"
        options={{ title: 'Leave', tabBarLabel: ({ focused }) => <TabLabel focused={focused}>Leave</TabLabel> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarLabel: ({ focused }) => <TabLabel focused={focused}>Profile</TabLabel> }}
      />
      {/* Pushed from the Profile hub only — href: null keeps them out of the tab bar
          (expo-router merges every file-based route into the Tabs navigator by default). */}
      <Tabs.Screen name="holidays" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />
    </Tabs>
  );
}
