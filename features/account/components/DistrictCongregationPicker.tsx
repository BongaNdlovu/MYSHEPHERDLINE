import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QueryStateView } from '@/components/ui/QueryStateView';
import { colors, radii, spacing } from '@/constants/theme';
import { fetchAllDistricts, fetchCongregationsByDistrict } from '@/lib/core/organization';
import { useQuery } from '@/lib/core/useQuery';
import type { District, Organization } from '@/types/database';

type DistrictCongregationPickerProps = {
  districtId: string | null;
  organizationId: string | null;
  onDistrictChange: (districtId: string | null) => void;
  onOrganizationChange: (organizationId: string | null) => void;
  districtTestId?: string;
  congregationTestId?: string;
};

export function DistrictCongregationPicker({
  districtId,
  organizationId,
  onDistrictChange,
  onOrganizationChange,
  districtTestId,
  congregationTestId,
}: DistrictCongregationPickerProps) {
  const districtsQuery = useQuery({
    deps: [],
    errorMessage: 'Unable to load districts.',
    initialData: [] as District[],
    fetch: fetchAllDistricts,
  });

  const fetchCongregations = useCallback(async () => {
    if (!districtId) return [] as Organization[];
    return fetchCongregationsByDistrict(districtId);
  }, [districtId]);

  const congregationsQuery = useQuery({
    deps: [districtId],
    enabled: Boolean(districtId),
    errorMessage: 'Unable to load congregations.',
    initialData: [] as Organization[],
    fetch: fetchCongregations,
  });

  const congregations = districtId ? congregationsQuery.data : [];
  const congregationsLoading = congregationsQuery.loading;
  const congregationsError = congregationsQuery.error;

  const selectedDistrict = useMemo(
    () => districtsQuery.data.find((d) => d.id === districtId) ?? null,
    [districtId, districtsQuery.data],
  );

  const selectedCongregation = useMemo(
    () => congregations.find((o) => o.id === organizationId) ?? null,
    [congregations, organizationId],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>District</Text>
      <QueryStateView
        loading={districtsQuery.loading}
        error={districtsQuery.error}
        onRetry={() => void districtsQuery.refresh()}
        isEmpty={!districtsQuery.loading && !districtsQuery.error && !districtsQuery.data.length}
        emptyMessage="No districts configured yet."
      />
      {!districtsQuery.loading && !districtsQuery.error ? (
        <View style={styles.chips} testID={districtTestId}>
          {districtsQuery.data.map((district) => {
            const active = district.id === districtId;
            return (
              <Pressable
                key={district.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  onDistrictChange(district.id);
                  onOrganizationChange(null);
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{district.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedDistrict ? (
        <>
          <Text style={styles.label}>Conference / Congregation</Text>
          <QueryStateView
            loading={congregationsLoading}
            error={congregationsError}
            onRetry={() => void congregationsQuery.refresh()}
            isEmpty={!congregationsLoading && !congregationsError && !congregations.length}
            emptyMessage="No congregations in this district yet."
          />
          {!congregationsLoading && !congregationsError ? (
            <View style={styles.chips} testID={congregationTestId}>
              {congregations.map((org) => {
                const active = org.id === organizationId;
                return (
                  <Pressable
                    key={org.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => onOrganizationChange(org.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{org.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {selectedCongregation ? (
            <Text style={styles.selected}>
              Selected: {selectedDistrict.name} · {selectedCongregation.name}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#ecfdf5' },
  chipText: { fontWeight: '600', color: colors.primary },
  chipTextActive: { color: colors.primary },
  selected: { color: colors.textMuted, fontSize: 13, marginTop: spacing.sm },
});
