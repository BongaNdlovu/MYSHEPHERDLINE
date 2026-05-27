import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { VisitListRow } from '@/features/visits/services/visits.service';

const visitTypeLabels: Record<string, string> = {
  visit: 'Visit',
  call: 'Call',
  bible_study: 'Bible Study',
  other: 'Other',
};

type VisitTimelineItemProps = {
  visit: VisitListRow;
};

export function VisitTimelineItem({ visit }: VisitTimelineItemProps) {
  const label = visitTypeLabels[visit.visit_type] ?? visit.visit_type;
  const dateLabel = new Date(visit.visited_at).toLocaleString();

  return (
    <View style={styles.item} testID={`visit-timeline-${visit.id}`}>
      <View style={styles.icon}>
        <Feather name="clock" size={14} color={colors.info} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>
          {label}
          {visit.follow_up_required ? ' · Follow-up required' : ''}
        </Text>
        <Text style={styles.date}>{dateLabel}</Text>
        {visit.notes?.trim() ? (
          <Text style={styles.notes} numberOfLines={3}>
            {visit.notes.trim()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: colors.primary },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  notes: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
});
