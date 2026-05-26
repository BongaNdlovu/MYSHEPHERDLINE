import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/features/members/components/FilterChips';
import { MemberListItem } from '@/features/members/components/MemberListItem';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors } from '@/constants/theme';
import { filterMembers, type MemberFilter } from '@/features/members/selectors/members';
import { useMembers } from '@/features/members/hooks/useMembers';

const filterOptions: { label: string; value: MemberFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'At Risk', value: 'risk' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'New', value: 'new' },
];

export default function MembersScreen() {
  const { data: members, loading, error } = useMembers();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MemberFilter>('all');

  const filtered = useMemo(() => filterMembers(members, query, filter), [members, query, filter]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.members.screen}>
      <AppHeader
        title="Members"
        subtitle={`${filtered.length} in directory`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search directory..."
        searchTestID={testIds.members.search}
      />

      <FilterChips
        options={filterOptions}
        value={filter}
        onChange={setFilter}
        testIdForValue={(value) => testIds.members.filter(value)}
      />

      <Card title="Congregation Directory">
        <QueryStateView
          loading={loading}
          error={error}
          isEmpty={!filtered.length}
          emptyMessage="No members match your search or filter."
        />
        {filtered.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
            testID={testIds.members.member(member.id)}
            onPress={() => router.push(`/member/${member.id}`)}
          />
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 24 },
});
