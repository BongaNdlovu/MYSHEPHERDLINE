import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { AdminMenuCard } from '@/features/admin/components/AdminMenuCard';
import { adminMenuItems } from '@/features/admin/selectors/admin-menu';
import { AppHeader } from '@/components/ui/AppHeader';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';

export default function AdminCenterScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.admin.center}>
      <AppHeader title="Admin Center" subtitle="Manage users, members, tasks, and operations" />
      {adminMenuItems.map((item) => (
        <AdminMenuCard
          key={item.id}
          item={item}
          testID={testIds.admin.menu(item.id)}
          onPress={() => router.push(item.route)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
