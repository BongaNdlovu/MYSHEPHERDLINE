import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatCard } from '@/features/reports/components/StatCard';
import { useReportSummary } from '@/features/reports';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { testIds } from '@/constants/testIds';
import { colors, spacing } from '@/constants/theme';
import { checkWorkerHealth } from '@/lib/core/api';
import { getAppEnv } from '@/lib/core/env';

export default function AdminReportsScreen() {
  const { summary, loading, error, refresh, workerUnavailable } = useReportSummary();
  const [workerHealthy, setWorkerHealthy] = useState<boolean | null>(null);
  const workerConfigured = Boolean(getAppEnv().workerApiUrl);

  useEffect(() => {
    let active = true;
    void checkWorkerHealth()
      .then((healthy) => {
        if (active) setWorkerHealthy(healthy);
      })
      .catch(() => {
        if (active) setWorkerHealthy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const workerLabel = workerConfigured
    ? workerHealthy === null
      ? 'Checking…'
      : workerHealthy
        ? 'Healthy'
        : 'Unreachable'
    : 'Not configured';

  const workerTone = !workerConfigured
    ? 'neutral'
    : workerHealthy === null
      ? 'info'
      : workerHealthy
        ? 'success'
        : 'urgent';

  return (
    <ScrollView style={styles.screen} testID={testIds.admin.reports.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </Pressable>
        <AppHeader title="Reports & Ops" subtitle="Organization summaries and platform status" />
      </View>

      <QueryStateView loading={loading} error={error} onRetry={() => void refresh()} />

      {summary ? (
        <View style={styles.stats}>
          <StatCard label="Need attention" value={summary.membersNeedingAttention} tone="orange" />
          <StatCard label="Visits (period)" value={summary.visitsCompleted} tone="blue" />
          <StatCard label="Open tasks" value={summary.tasksOpen} tone="green" />
        </View>
      ) : null}

      <Card title="Operations">
        <View style={styles.workerRow}>
          <Text style={styles.lineLabel}>Worker API</Text>
          <StatusBadge label={workerLabel} tone={workerTone} />
        </View>
        {workerUnavailable ? (
          <Text style={styles.note}>
            Reports are using local Supabase fallback because the Worker was unavailable.
          </Text>
        ) : null}
        <Text style={styles.note}>
          Push digest triggers run from the Cloudflare Worker cron route with owner or cron secret
          auth. Configure secrets in the Worker dashboard — not in app code.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingTop: spacing.md },
  back: { paddingLeft: spacing.lg, marginBottom: -spacing.md },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  lineLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
});
