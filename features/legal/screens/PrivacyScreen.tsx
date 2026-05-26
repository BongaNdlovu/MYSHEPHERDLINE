import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors, spacing } from '@/constants/theme';

export const options = { headerShown: true, title: 'Privacy Policy' };

const privacyContent = `MyShepherdLine Privacy Notice (Draft)

Responsible party: Your congregation / church administration must confirm the legal entity name and Information Officer details before production launch.

What we process:
- Shepherd account details (name, email)
- Congregation member contact details and pastoral care metadata
- Visit logs, tasks, and notification preferences

Why we process it:
- To support lawful pastoral care and congregation administration workflows authorized by the responsible party.

Lawful basis:
- Processing is based on the responsible party's legitimate interests and consent/contractual arrangements with authorized users. Religious affiliation context may constitute special personal information under POPIA and requires legal review.

Operators:
- Supabase (database/auth)
- Cloudflare Workers (protected API)
- Expo push notification services

Retention:
- See docs/compliance/retention-schedule.md

Your rights:
- Access, correction, deletion, and objection requests can be submitted to your congregation Information Officer.

Security incidents:
- The responsible party will assess and notify affected data subjects and the Information Regulator where required under POPIA section 22.

Cross-border transfers:
- Vendor infrastructure may process data outside South Africa. The responsible party must confirm appropriate safeguards before launch.

Legal review required before production use.`;

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.body}>{privacyContent}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  body: { color: colors.text, lineHeight: 22, fontSize: 14 },
});
