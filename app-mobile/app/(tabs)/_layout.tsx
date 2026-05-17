import { Tabs } from 'expo-router';
import { Home, BookOpen, ListChecks, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { C, F } from '../../src/lib/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.rust,
        tabBarInactiveTintColor: C.inkMuted,
        tabBarStyle: {
          backgroundColor: C.paper,
          borderTopColor: C.hairline,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 30 : 8,
        },
        tabBarLabelStyle: {
          fontFamily: F.sansMedium, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen name="index"      options={{ title: 'Report',      tabBarIcon: ({ color, focused }) => <Home       size={22} color={color} strokeWidth={focused ? 2.4 : 1.7} /> }} />
      <Tabs.Screen name="my-reports" options={{ title: 'My reports',  tabBarIcon: ({ color, focused }) => <ListChecks size={22} color={color} strokeWidth={focused ? 2.4 : 1.7} /> }} />
      <Tabs.Screen name="guide"      options={{ title: 'Field guide', tabBarIcon: ({ color, focused }) => <BookOpen   size={22} color={color} strokeWidth={focused ? 2.4 : 1.7} /> }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profile',     tabBarIcon: ({ color, focused }) => <User       size={22} color={color} strokeWidth={focused ? 2.4 : 1.7} /> }} />
    </Tabs>
  );
}
