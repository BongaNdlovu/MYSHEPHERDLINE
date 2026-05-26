import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { QueryStateView } from '@/components/QueryStateView';
import { StatCard } from '@/components/StatCard';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useReportSummary } from '@/lib/hooks/useReportSummary';

export default function ReportsScreen() {
  const { summary, loading, error, source } = useReportSummary();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.reports.screen}>
      <AppHeader
        title="Reports"
        subtitle={summary ? `Last ${summary.recentActivityDays} days` : 'Activity summary'}
      />

      <QueryStateView loading={loading} error={error} isEmpty={!summary} emptyMessage="No report data available." />

      {summary ? (
        <>
          <View style={styles.rangePill}>
            <Text style={styles.rangeText}>
              Last {summary.recentActivityDays} days{source ? ` (${source})` : ''}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard label="Visits" value={summary.visitBreakdown.visits} tone="blue" />
            <StatCard label="Calls" value={summary.visitBreakdown.calls} tone="green" />
            <StatCard label="Bible Studies" value={summary.visitBreakdown.bibleStudies} tone="purple" />
            <StatCard label="New Members" value={summary.visitBreakdown.newConverts} tone="orange" />
          </View>

          <Card title="Summary">
            <View testID={testIds.reports.summary}>
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
            </View>
          </Card>
        </>
      ) : null}
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
