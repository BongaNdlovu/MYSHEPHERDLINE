import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OwnerRoute } from '@/features/admin';
import { useAdminProfiles } from '@/features/admin/hooks/useAdminProfiles';
import { isOwnerRole } from '@/features/admin/selectors/guard';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PaginatedFlatList } from '@/components/ui/PaginatedFlatList';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useToast } from '@/lib/core/toast';
import type { Profile, UserRole } from '@/types/database';

export default function AdminUsersScreen() {
  const { data: profiles, loading, error, refresh, setRole, setAccess, loadMore, hasMore, loadingMore } =
    useAdminProfiles();
  const { showToast } = useToast();

  return (
    <OwnerRoute>
      <View style={styles.screen} testID={testIds.admin.users.screen}>
        <PaginatedFlatList
          data={profiles}
          keyExtractor={(profile) => profile.id}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => void loadMore()}
          ListHeaderComponent={
            <>
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace('/admin');
                  }}
                  style={styles.back}
                >
                  <Feather name="chevron-left" size={24} color={colors.primary} />
                </Pressable>
                <AppHeader title="Users & Roles" subtitle="Approve access and assign roles" />
              </View>
              <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />
            </>
          }
          renderItem={({ item: profile }) => (
            <UserRow
              profile={profile}
              onRole={(role) =>
                void setRole(profile.id, role).then((result) => {
                  if (result.error) showToast(result.error.message);
                  else showToast('Role updated.');
                })
              }
              onAccess={(active) =>
                void setAccess(profile.id, active).then((result) => {
                  if (result.error) showToast(result.error.message);
                  else showToast(active ? 'Access enabled.' : 'Access deactivated.');
                })
              }
            />
          )}
        />
      </View>
    </OwnerRoute>
  );
}

function UserRow({
  profile,
  onRole,
  onAccess,
}: {
  profile: Profile;
  onRole: (role: UserRole) => void;
  onAccess: (active: boolean) => void;
}) {
  const isOwnerAccount = isOwnerRole(profile.role);
  const nextRole: UserRole = profile.role === 'admin' ? 'shepherd' : 'admin';

  return (
    <Card title={profile.display_name}>
      <Text style={styles.meta}>{profile.email}</Text>
      <Text style={styles.meta}>
        Role: {profile.role} | {profile.is_active ? 'Active' : 'Deactivated'}
      </Text>
      <View style={styles.actions}>
        <Pressable style={styles.chip} disabled={isOwnerAccount} onPress={() => onRole(nextRole)}>
          <Text style={styles.chipText}>
            {profile.role === 'admin' ? 'Demote to shepherd' : 'Promote to admin'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.chip, styles.chipDanger]}
          disabled={isOwnerAccount}
          onPress={() => onAccess(!profile.is_active)}
        >
          <Text style={styles.chipText}>{profile.is_active ? 'Deactivate' : 'Activate'}</Text>
        </Pressable>
      </View>
      {isOwnerAccount ? (
        <Text style={styles.note}>Owner account — role and access are locked.</Text>
      ) : (
        <Text style={styles.note}>
          New shepherds are invited from Admin → Access Requests, then appear here after they accept and sign in.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingTop: spacing.md },
  back: { paddingLeft: spacing.lg, marginBottom: -spacing.md },
  meta: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipDanger: { backgroundColor: colors.accent },
  chipText: { color: colors.white, fontWeight: '600', fontSize: 12 },
  note: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, lineHeight: 18 },
});
