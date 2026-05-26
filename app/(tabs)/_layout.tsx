import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import { testIds } from '@/constants/testIds';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopColor: colors.border,
          paddingTop: 8,
          height: 72,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarButtonTestID: testIds.tabs.home,
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarButtonTestID: testIds.tabs.members,
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarButtonTestID: testIds.tabs.tasks,
          tabBarIcon: ({ color }) => <FontAwesome name="check-square-o" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarButtonTestID: testIds.tabs.reports,
          tabBarIcon: ({ color }) => <FontAwesome name="bar-chart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarButtonTestID: testIds.tabs.more,
          tabBarIcon: ({ color }) => <FontAwesome name="ellipsis-h" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
