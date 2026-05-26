import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { StatCard, useReportSummary } from '@/features/reports';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';

export default function ReportsScreen() {
  const { summary, loading, error, source, workerUnavailable, refresh } = useReportSummary();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} testID={testIds.reports.screen}>
      <AppHeader
        title="Reports"
        subtitle={summary ? `Last ${summary.recentActivityDays} days` : 'Activity summary'}
      />

      <QueryStateView
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !summary}
        emptyMessage="No report data available."
        onRetry={() => void refresh()}
      />

      {summary ? (
        <>
          {workerUnavailable ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Live report service is unavailable. Showing locally aggregated data.
              </Text>
            </View>
          ) : null}

          <View style={styles.rangePill}>
            <Text style={styles.rangeText}>
              Last {summary.recentActivityDays} days
              {source === 'worker' ? ' (live service)' : source === 'supabase' ? ' (local fallback)' : ''}
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
  notice: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  noticeText: { color: '#991b1b', fontWeight: '600', lineHeight: 18, fontSize: 13 },
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
