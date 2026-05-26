import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { colors, radii, spacing } from '@/constants/theme';
import { fetchReportSummary } from '@/lib/api';
import { buildLocalReportSummary, useMembers, useTasks } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { ReportSummary } from '@/types/database';

export default function ReportsScreen() {
  const { session } = useAuth();
  const { members } = useMembers();
  const { tasks } = useTasks();
  const [summary, setSummary] = useState<ReportSummary>(() => buildLocalReportSummary(members, tasks));

  useEffect(() => {
    setSummary(buildLocalReportSummary(members, tasks));
  }, [members, tasks]);

  useEffect(() => {
    if (!session?.access_token) return;
    void fetchReportSummary(session.access_token).then((remote) => {
      if (remote) setSummary(remote);
    });
  }, [session?.access_token]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppHeader title="Reports" subtitle={`Last ${summary.recentActivityDays} days`} />

      <View style={styles.rangePill}>
        <Text style={styles.rangeText}>Last {summary.recentActivityDays} days</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Visits" value={summary.visitBreakdown.visits} tone="blue" />
        <StatCard label="Calls" value={summary.visitBreakdown.calls} tone="green" />
        <StatCard label="Bible Studies" value={summary.visitBreakdown.bibleStudies} tone="purple" />
        <StatCard label="New Converts" value={summary.visitBreakdown.newConverts} tone="orange" />
      </View>

      <Card title="Summary">
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Members needing attention</Text>
          <Text style={styles.summaryValue}>{summary.membersNeedingAttention}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Visits completed</Text>
          <Text style={styles.summaryValue}>{summary.visitsCompleted}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Open tasks</Text>
          <Text style={styles.summaryValue}>{summary.tasksOpen}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 24 },
  rangePill: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeText: { fontWeight: '700', color: colors.primary, fontSize: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { color: colors.textSecondary, fontWeight: '600' },
  summaryValue: { color: colors.primary, fontWeight: '800', fontSize: 16 },
});
