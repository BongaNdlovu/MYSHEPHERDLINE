import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { FilterChips } from '@/components/FilterChips';
import { MemberListItem } from '@/components/MemberListItem';
import { colors } from '@/constants/theme';
import { filterMembers, useMembers } from '@/lib/data';
import { useToast } from '@/lib/toast';

type MemberFilter = 'all' | 'risk' | 'inactive' | 'new';

const filterOptions: { label: string; value: MemberFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'At Risk', value: 'risk' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'New', value: 'new' },
];

export default function MembersScreen() {
  const { showToast } = useToast();
  const { members } = useMembers();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MemberFilter>('all');

  const filtered = useMemo(
    () => filterMembers(members, query, filter),
    [members, query, filter],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader
        title="Members"
        subtitle={`${filtered.length} in directory`}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search directory..."
        onFilterPress={() => showToast(`Filter: ${filter}`)}
      />

      <FilterChips options={filterOptions} value={filter} onChange={setFilter} />

      <Card title="Congregation Directory">
        {filtered.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
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
