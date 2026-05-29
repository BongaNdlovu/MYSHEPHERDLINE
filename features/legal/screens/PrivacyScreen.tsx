import { ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
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

type PrivacySection = { title: string; body: string };

function parsePrivacySections(content: string): PrivacySection[] {
  const blocks = content.trim().split(/\n\n+/);
  if (blocks.length === 0) return [];

  const [intro, ...rest] = blocks;
  const introLines = intro.split('\n');
  const sections: PrivacySection[] = [
    {
      title: introLines[0] ?? 'Privacy Notice',
      body: introLines.slice(1).join('\n').trim() || (introLines[0] ?? ''),
    },
  ];

  for (const block of rest) {
    const lines = block.split('\n');
    const titleLine = lines[0] ?? '';
    const inlineColon = titleLine.match(/^([^:]+):\s*(.*)$/);
    if (inlineColon && lines.length === 1) {
      sections.push({ title: inlineColon[1].trim(), body: inlineColon[2].trim() });
      continue;
    }
    const title = titleLine.endsWith(':') ? titleLine.slice(0, -1).trim() : titleLine;
    const body = lines.length > 1 ? lines.slice(1).join('\n').trim() : '';
    sections.push({ title, body });
  }

  return sections;
}

const privacySections = parsePrivacySections(privacyContent);

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LegalReviewBanner />
      {privacySections.map((section) => (
        <Card key={section.title} title={section.title} style={styles.sectionCard}>
          <Text style={styles.body}>{section.body}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  sectionCard: { marginTop: 0 },
  body: { color: colors.textSecondary, lineHeight: 22, fontSize: 14, fontWeight: '500' },
});
