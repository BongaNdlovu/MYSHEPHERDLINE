export type AdminMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: 'users' | 'user-plus' | 'check-square' | 'bar-chart-2' | 'settings';
  route:
    | '/admin/users'
    | '/admin/members'
    | '/admin/tasks'
    | '/admin/reports'
    | '/admin/controls';
};

export const adminMenuItems: AdminMenuItem[] = [
  {
    id: 'users',
    title: 'Users & Roles',
    subtitle: 'Manage access and shepherd roles',
    icon: 'users',
    route: '/admin/users',
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
    subtitle: 'Legal links and admin documentation',
    icon: 'settings',
    route: '/admin/controls',
  },
];
