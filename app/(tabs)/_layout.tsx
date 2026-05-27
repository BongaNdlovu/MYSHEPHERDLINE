import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';

export { ErrorBoundary } from '@/components/ui/RouteErrorBoundary';

const TAB_BAR_CONTENT_HEIGHT = 56;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.sm);
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopColor: colors.border,
          paddingTop: spacing.sm,
          paddingBottom: bottomInset,
          height: tabBarHeight,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarButtonTestID: testIds.tabs.today,
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'People in Care',
          tabBarButtonTestID: testIds.tabs.people,
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log-action"
        options={{
          title: 'Log Action',
          tabBarButtonTestID: testIds.tabs.logAction,
          tabBarIcon: ({ color }) => <FontAwesome name="plus-circle" size={24} color={color} />,
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
        name="more"
        options={{
          title: 'Me',
          tabBarButtonTestID: testIds.tabs.me,
          tabBarIcon: ({ color }) => <FontAwesome name="ellipsis-h" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
