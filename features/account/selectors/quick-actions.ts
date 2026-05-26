export type AccountQuickAction = {
  title: string;
  subtitle: string;
  icon: 'shield' | 'file-text';
  route: '/legal/privacy' | '/legal/terms';
};

export const accountQuickActions: AccountQuickAction[] = [
  {
    title: 'Privacy Policy',
    subtitle: 'Read how we handle personal information',
    icon: 'shield',
    route: '/legal/privacy',
  },
  {
    title: 'Terms & Conditions',
    subtitle: 'App usage terms',
    icon: 'file-text',
    route: '/legal/terms',
  },
];
