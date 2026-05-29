import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, shadows, spacing } from '@/constants/theme';
import { OwnerRoute } from '@/features/admin';
import { useCongregation } from '@/features/members/hooks/useCongregation';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { createCongregation, fetchDistrictCongregations } from '@/lib/core/organization';
import { useQuery } from '@/lib/core/useQuery';
import type { Organization } from '@/types/database';

export default function AdminCongregationsScreen() {
  const { context, congregationLabel, loading: contextLoading, error: contextError, refresh: refreshContext } =
    useCongregation();
  const congregationsQuery = useQuery({
    deps: [],
    errorMessage: 'Unable to load congregations.',
    initialData: [] as Organization[],
    fetch: fetchDistrictCongregations,
  });
  const { data: congregations, loading, error, refresh: refreshCongregations } = congregationsQuery;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const save = () => {
    if (!name.trim() || !slug.trim()) {
      setSubmitError('Name and slug are required.');
      return;
    }

    setSaving(true);
    setSubmitError(null);
    void createCongregation({
      name,
      slug,
      districtId: context?.district?.id ?? null,
    })
      .then(async () => {
        setName('');
        setSlug('');
        await refreshCongregations();
        await refreshContext();
      })
      .catch((err) => {
        setSubmitError(getUserMessage(toAppError(err, 'Unable to create congregation.')));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <OwnerRoute>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        testID={testIds.admin.congregations.screen}
      >
        <AppHeader title="Congregations" subtitle={congregationLabel ?? 'Your district congregations'} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your congregation</Text>
          <QueryStateView loading={contextLoading} error={contextError} onRetry={() => void refreshContext()} />
          {context ? (
            <Text style={styles.body}>
              {context.organization.name}
              {context.district ? ` · ${context.district.name}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Congregations in your district</Text>
          <QueryStateView
            loading={loading}
            error={error}
            isEmpty={!loading && !error && congregations.length === 0}
            emptyMessage="No congregations found in this district yet."
            onRetry={() => void refreshCongregations()}
          />
          {congregations.map((congregation) => (
            <View key={congregation.id} style={styles.row}>
              <Text style={styles.rowTitle}>{congregation.name}</Text>
              <Text style={styles.rowMeta}>{congregation.slug}</Text>
            </View>
          ))}
        </View>

        <Card
          title="Add congregation"
          badge="Owner only"
          badgeTone="purple"
          style={styles.addCard}
        >
          <Text style={styles.help}>
            Creates a new congregation tenant in your district. Assign shepherds to it via Supabase Auth and Admin
            {' -> '}Users & Roles.
          </Text>
          <FormField label="Congregation name" value={name} onChangeText={setName} />
          <FormField
            label="Slug (unique id, e.g. river-park)"
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
          />
          {submitError ? <InlineError message={submitError} /> : null}
          <Pressable style={styles.primary} disabled={saving} onPress={save}>
            <Text style={styles.primaryText}>{saving ? 'Creating...' : 'Create congregation'}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </OwnerRoute>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  addCard: { marginTop: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  body: { color: colors.text, lineHeight: 22 },
  help: { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontWeight: '600', color: colors.text },
  rowMeta: { color: colors.textMuted, marginTop: 2 },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.white, fontWeight: '700' },
});
