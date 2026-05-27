export type AdminMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: 'users' | 'user-plus' | 'check-square' | 'bar-chart-2' | 'settings';
  route:
    | '/admin/users'
    | '/admin/congregations'
    | '/admin/members'
    | '/admin/tasks'
    | '/admin/reports'
    | '/admin/controls';
  ownerOnly?: boolean;
};

export const adminMenuItems: AdminMenuItem[] = [
  {
    id: 'users',
    title: 'Users & Roles',
    subtitle: 'Manage access and shepherd roles',
    icon: 'users',
    route: '/admin/users',
    ownerOnly: true,
  },
  {
    id: 'congregations',
    title: 'Congregations',
    subtitle: 'District congregations and new church tenants',
    icon: 'users',
    route: '/admin/congregations',
    ownerOnly: true,
  },
  {
    id: 'members',
    title: 'Members',
    subtitle: 'Create, edit, and assign members',
    icon: 'user-plus',
    route: '/admin/members',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    subtitle: 'Create, assign, and close tasks',
    icon: 'check-square',
    route: '/admin/tasks',
  },
  {
    id: 'reports',
    title: 'Reports & Ops',
    subtitle: 'Summaries, worker health, notifications',
    icon: 'bar-chart-2',
    route: '/admin/reports',
  },
  {
    id: 'controls',
    title: 'App Controls',
    subtitle: 'Legal links and compliance references',
    icon: 'settings',
    route: '/admin/controls',
    ownerOnly: true,
  },
];

export function visibleAdminMenuItems(isOwner: boolean) {
  return adminMenuItems.filter((item) => !item.ownerOnly || isOwner);
}
