import { ScrollView, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { LegalReviewBanner } from '@/features/legal/components/LegalReviewBanner';
import { colors, spacing } from '@/constants/theme';

export const options = { headerShown: true, title: 'Terms & Conditions' };

const termsContent = `MyShepherdLine Terms & Conditions (Draft — Internal Shepherd Tool)

1. Authorized use only. Accounts are for authorized shepherds/admins of the congregation. Public self-registration is not supported.
2. Scope. This app supports internal member care, visits, and tasks. Public visitor intake, prayer requests, and event registration are handled outside this app unless a future version explicitly adds them after legal review.
3. Accurate data. Users must enter and maintain accurate member and visit records they are authorized to manage.
4. Confidentiality. Member information must not be shared outside authorized pastoral workflows.
5. No misuse. Automated scraping, unauthorized exports, or attempts to bypass security controls are prohibited.
6. Availability. The service is provided on a best-effort basis unless otherwise agreed in writing.
7. Suspension. The responsible party may suspend accounts for misuse or security concerns.
8. Changes. These terms may be updated; continued use after notice constitutes acceptance where permitted by law.
9. Liability. To the extent permitted by law, liability is limited to direct damages caused by proven negligence.
10. Governing framework. South African law applies, including POPIA and PAIA where relevant.

Counsel must complete legal review before production use.`;

type TermsSection = { number: number | null; title: string; body: string };

function parseTermsSections(content: string): TermsSection[] {
  const lines = content.trim().split('\n');
  const sections: TermsSection[] = [];
  let intro = '';
  let current: TermsSection | null = null;

  const flush = () => {
    if (current) {
      sections.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      flush();
      const rest = numbered[2];
      const dotIndex = rest.indexOf('. ');
      if (dotIndex > 0 && dotIndex < 80) {
        current = {
          number: Number(numbered[1]),
          title: rest.slice(0, dotIndex),
          body: rest.slice(dotIndex + 2).trim(),
        };
      } else {
        current = {
          number: Number(numbered[1]),
          title: `Section ${numbered[1]}`,
          body: rest.trim(),
        };
      }
      continue;
    }

    if (current) {
      current.body = current.body ? `${current.body}\n${line}` : line;
    } else {
      intro = intro ? `${intro}\n${line}` : line;
    }
  }
  flush();

  if (intro.trim()) {
    const introLines = intro.trim().split('\n');
    sections.unshift({
      number: null,
      title: introLines[0] ?? 'Terms & Conditions',
      body: introLines.slice(1).join('\n').trim() || (introLines[0] ?? ''),
    });
  }

  return sections;
}

const termsSections = parseTermsSections(termsContent);

export default function TermsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LegalReviewBanner />
      {termsSections.map((section) => (
        <Card
          key={section.number ?? section.title}
          title={section.number != null ? `${section.number}. ${section.title}` : section.title}
          style={styles.sectionCard}
        >
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
