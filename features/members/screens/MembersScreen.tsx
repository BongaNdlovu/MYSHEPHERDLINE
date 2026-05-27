import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PaginatedFlatList } from '@/components/ui/PaginatedFlatList';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { FilterChips, MemberListItem, filterMembers, useMembers, useCongregation, type MemberFilter } from '@/features/members';
import { isInitialLoad, queryDisplayError } from '@/lib/core/query-types';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

const filterOptions: { label: string; value: MemberFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'At Risk', value: 'risk' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'New', value: 'new' },
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

  const serverFilter = useMemo(() => {
    if (filter === 'inactive') return { status: 'inactive' as const };
    if (filter === 'new') return { status: 'new' as const };
    if (filter === 'risk') return { riskLevel: 'high' as const };
    return {};
  }, [filter]);

  const { data: members, loading, error, refresh, loadMore, hasMore, loadingMore } = useMembers({
    search: debouncedQuery || undefined,
    ...serverFilter,
  });
  const { congregationLabel } = useCongregation();

  const filtered = useMemo(
    () => (filter === 'risk' ? filterMembers(members, '', 'risk') : members),
    [filter, members],
  );
  const initialLoad = isInitialLoad(loading, filtered.length);
  const headerSubtitle = congregationLabel
    ? `${filtered.length} in directory · ${congregationLabel}`
    : `${filtered.length} in directory`;

  return (
    <View style={styles.screen} testID={testIds.members.screen}>
      <PaginatedFlatList
        data={filtered}
        keyExtractor={(member) => member.id}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
        ListHeaderComponent={
          <>
            <AppHeader
              title="Members"
              subtitle={headerSubtitle}
              searchValue={query}
              onSearchChange={setQuery}
              searchPlaceholder="Search directory..."
              searchTestID={testIds.members.search}
            />
            <Pressable
              style={styles.addButton}
              testID={testIds.members.add}
              onPress={() => router.push('/members/new')}
            >
              <Feather name="plus" size={18} color={colors.white} />
              <Text style={styles.addText}>Add member</Text>
            </Pressable>
            <FilterChips
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              testIdForValue={(value) => testIds.members.filter(value)}
            />
            <Card title="Congregation Directory">
              <QueryStateView
                loading={initialLoad}
                error={queryDisplayError(error, filtered.length)}
                isEmpty={!initialLoad && !error && !filtered.length}
                emptyMessage="No members match your search or filter."
                onRetry={() => void refresh()}
              />
              <QueryRefreshFeedback
                loading={loading}
                error={error}
                dataLength={filtered.length}
                refreshingLabel="Refreshing members…"
                staleErrorLabel="Could not refresh members. Showing last loaded data."
              />
            </Card>
          </>
        }
        renderItem={({ item: member }) => (
          <MemberListItem
            member={member}
            testID={testIds.members.member(member.id)}
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
