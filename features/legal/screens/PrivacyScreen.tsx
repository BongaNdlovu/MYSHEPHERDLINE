import { ScrollView, StyleSheet, Text } from 'react-native';

import { LegalReviewBanner } from '@/features/legal/components/LegalReviewBanner';
import { colors, spacing } from '@/constants/theme';

export const options = { headerShown: true, title: 'Privacy Policy' };

const privacyContent = `MyShepherdLine Privacy Notice (Draft — Internal Shepherd Tool)

Scope: This app is for authorized congregation staff only. It is not a public website and does not accept visitor registrations, prayer requests, or event sign-ups.

Responsible party: Your congregation must confirm the legal entity name and Information Officer details before production launch.

What we process:
- Shepherd account details (name, email)
- Congregation member contact details and pastoral care metadata (for members in your care program)
- Visit logs, tasks, and notification preferences

What we do not process in this version:
- Public visitor or contact form submissions
- Prayer request queues
- Event registrations or public web forms
- Bulk CSV exports to third parties

Why we process it:
- To support lawful pastoral care and congregation administration by authorized staff.

Lawful basis:
- Processing must be confirmed by your legal counsel (POPIA). Religious affiliation context may constitute special personal information.

Operators:
- Supabase (database/auth)
- Cloudflare Workers (protected API)
- Expo push notification services

Retention:
- See congregation retention schedule (docs/compliance/retention-schedule.md)

Your rights:
- Access, correction, deletion, and objection requests via your congregation Information Officer.

Security incidents:
- Assessed under POPIA section 22; Regulator notification where required.

Cross-border transfers:
- Vendor infrastructure may process data outside South Africa. Confirm safeguards before launch.

Counsel must complete legal review before production use. See docs/compliance/legal-review-signoff.md.`;

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LegalReviewBanner />
      <Text style={styles.body}>{privacyContent}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  body: { color: colors.text, lineHeight: 22, fontSize: 14 },
});
