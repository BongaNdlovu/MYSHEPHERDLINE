import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, toneColors } from '@/constants/theme';

type NoticeTone = 'urgent' | 'warning' | 'info' | 'success';

const iconForTone: Record<NoticeTone, keyof typeof Feather.glyphMap> = {
  urgent: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
  success: 'check-circle',
};

export function NoticeCard({ title, message, tone = 'info' }: { title?: string; message: string; tone?: NoticeTone }) {
  const palette = tone === 'success' ? toneColors.success : toneColors[tone];
  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.surface }]}>
        <Feather name={iconForTone[tone]} size={18} color={palette.text} />
      </View>
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: palette.text }]}>{title}</Text> : null}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontWeight: '800', fontSize: 15, marginBottom: 2 },
  message: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
