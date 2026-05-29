import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PaginatedFlatList } from '@/components/ui/PaginatedFlatList';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { FilterChips, MemberListItem, useMembers, useCongregation, type MemberFilter } from '@/features/members';
import { isInitialLoad, queryDisplayError } from '@/lib/core/query-types';
import { useAuth } from '@/lib/core/auth';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

const filterOptions: { label: string; value: MemberFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'Not Contacted', value: 'not_contacted' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'New', value: 'new' },
  { label: 'Bible Study', value: 'bible_study' },
  { label: 'Baptism Interest', value: 'baptism_interest' },
  { label: 'My Assigned People', value: 'my_people' },
];

const SEARCH_DEBOUNCE_MS = 300;

export default function MembersScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState<MemberFilter>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { user } = useAuth();
  const userId = user?.id ?? null;

  const serverFilter = useMemo(() => {
    if (filter === 'inactive') return { status: 'inactive' as const };
    if (filter === 'new') return { status: 'new' as const };
    if (filter === 'urgent') return { riskLevel: 'high' as const };
    if (filter === 'bible_study') return { careStage: 'bible_study' as const };
    if (filter === 'baptism_interest') return { careStage: 'baptism_interest' as const };
    if (filter === 'not_contacted') return { notContacted: true as const };
    if (filter === 'my_people') return userId ? { assignedTo: userId } : {};
    return {};
  }, [filter, userId]);

  const { data: members, loading, error, refresh, loadMore, hasMore, loadingMore } = useMembers({
    search: debouncedQuery || undefined,
    ...serverFilter,
  });
  const { congregationLabel } = useCongregation();

  const initialLoad = isInitialLoad(loading, members.length);
  const headerSubtitle = congregationLabel
    ? `${members.length} in care · ${congregationLabel}`
    : `${members.length} in care`;

  return (
      <View style={styles.screen} testID={testIds.people.screen}>
      <PaginatedFlatList
        data={members}
        keyExtractor={(member) => member.id}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            <AppHeader
              title="People in Care"
              subtitle={headerSubtitle}
              searchValue={query}
              onSearchChange={setQuery}
              searchPlaceholder="Search people in care..."
              searchTestID={testIds.people.search}
            />
            <Pressable
              style={styles.addButton}
              testID={testIds.people.add}
              onPress={() => router.push('/members/new')}
            >
              <Feather name="plus" size={18} color={colors.white} />
              <Text style={styles.addText}>Add person</Text>
            </Pressable>
            <FilterChips
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              testIdForValue={(value) => testIds.people.filter(value)}
            />
            <Card title="People Directory">
              <QueryStateView
                loading={initialLoad}
                error={queryDisplayError(error, members.length)}
                isEmpty={!initialLoad && !error && !members.length}
                emptyMessage="No people match your search or filter."
                onRetry={() => void refresh()}
              />
              <QueryRefreshFeedback
                loading={loading}
                error={error}
                dataLength={members.length}
                refreshingLabel="Refreshing people…"
                staleErrorLabel="Could not refresh people. Showing last loaded data."
              />
            </Card>
          </>
        }
        renderItem={({ item: member }) => (
          <MemberListItem
            member={member}
            testID={testIds.people.member(member.id)}
            onPress={() => router.push(`/member/${member.id}`)}
          />
        )}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 24 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  addText: { color: colors.white, fontWeight: '700' },
});
