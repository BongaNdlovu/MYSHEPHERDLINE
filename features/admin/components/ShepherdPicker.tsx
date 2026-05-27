import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import { listAssignableShepherds } from '@/lib/core/assignment';
import type { Profile } from '@/types/database';

type ShepherdPickerProps = {
  profiles: Profile[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (shepherdId: string) => void;
  getTestId?: (shepherdId: string) => string;
};

export function ShepherdPicker({
  profiles,
  loading,
  selectedId,
  onSelect,
  getTestId,
}: ShepherdPickerProps) {
  const shepherds = listAssignableShepherds(profiles);

  return (
    <>
      <Text style={styles.section}>Assigned shepherd</Text>
      {loading ? (
        <Text style={styles.hint}>Loading shepherds…</Text>
      ) : shepherds.length === 0 ? (
        <Text style={styles.hint}>No active shepherds available. Create shepherd accounts first.</Text>
      ) : (
        <View style={styles.chips}>
          {shepherds.map((shepherd) => (
            <Pressable
              key={shepherd.id}
              style={[styles.chip, selectedId === shepherd.id && styles.chipActive]}
              testID={getTestId?.(shepherd.id)}
              onPress={() => onSelect(shepherd.id)}
            >
              <Text style={styles.chipText}>{shepherd.display_name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#ecfdf5' },
  chipText: { fontWeight: '600', color: colors.primary, textTransform: 'capitalize' },
  hint: { color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 18 },
});
