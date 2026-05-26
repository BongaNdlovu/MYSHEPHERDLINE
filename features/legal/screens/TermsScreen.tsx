import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export const options = { headerShown: true, title: 'Terms & Conditions' };

const termsContent = `MyShepherdLine Terms & Conditions (Draft)

1. Authorized use only. Accounts are for authorized shepherds/admins of the congregation.
2. Accurate data. Users must enter and maintain accurate member and visit records they are authorized to manage.
3. Confidentiality. Member information must not be shared outside authorized pastoral workflows.
4. No misuse. Automated scraping, unauthorized exports, or attempts to bypass security controls are prohibited.
5. Availability. The service is provided on a best-effort basis unless otherwise agreed in writing.
6. Suspension. The responsible party may suspend accounts for misuse or security concerns.
7. Changes. These terms may be updated; continued use after notice constitutes acceptance where permitted by law.
8. Liability. To the extent permitted by law, liability is limited to direct damages caused by proven negligence.
9. Governing framework. South African law applies, including POPIA and PAIA where relevant.

Legal review required before production use.`;

export default function TermsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.body}>{termsContent}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  body: { color: colors.text, lineHeight: 22, fontSize: 14 },
});
