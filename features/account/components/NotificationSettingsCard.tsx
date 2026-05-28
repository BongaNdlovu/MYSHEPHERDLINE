import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useNotificationStatus } from '@/features/account/hooks/useNotificationStatus';
import { Card } from '@/components/ui/Card';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/core/auth';
import { enableNotifications, notificationStatusLabel } from '@/lib/core/notification-settings';
import { useToast } from '@/lib/core/toast';

export function NotificationSettingsCard() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const { data: status, loading, refresh } = useNotificationStatus();
  const [enabling, setEnabling] = useState(false);

  const canEnable =
    Boolean(session?.access_token) &&
    !loading &&
    status !== 'granted' &&
    status !== 'development_build_required' &&
    status !== 'unsupported' &&
    status !== 'simulator' &&
    status !== 'worker_unconfigured';

  const onEnable = async () => {
    const token = session?.access_token;
    if (!token || enabling) return;

    setEnabling(true);
    const result = await enableNotifications(token);
    setEnabling(false);

    if (result.ok) {
      showToast('Notifications enabled.');
      await refresh();
      return;
    }

    showToast(result.error ?? 'Unable to enable notifications.');
    await refresh();
  };

  return (
    <Card title="Notifications">
      <Text style={styles.status} testID={testIds.notifications.status}>
        {loading ? 'Checking notification status…' : notificationStatusLabel(status)}
      </Text>
      {canEnable ? (
        <Pressable
          style={[styles.button, enabling && styles.buttonDisabled]}
          testID={testIds.notifications.enable}
          onPress={() => void onEnable()}
          disabled={enabling}
        >
          <Text style={styles.buttonText}>{enabling ? 'Enabling…' : 'Enable notifications'}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontWeight: '700' },
});
