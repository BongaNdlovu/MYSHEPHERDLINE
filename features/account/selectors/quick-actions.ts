export type AccountQuickAction = {
  title: string;
  subtitle: string;
  icon: 'user-plus' | 'edit-3' | 'shield' | 'file-text';
  route: '/(tabs)/members' | '/legal/privacy' | '/legal/terms';
};

export const accountQuickActions: AccountQuickAction[] = [
  {
    title: 'Add Member',
    subtitle: 'Open the member directory',
    icon: 'user-plus',
    route: '/(tabs)/members',
  },
  {
    title: 'Log Visit',
    subtitle: 'Choose a member to visit',
    icon: 'edit-3',
    route: '/(tabs)/members',
  },
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
