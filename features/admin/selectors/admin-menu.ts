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
    | '/admin/assignment-requests'
    | '/admin/access-requests'
    | '/admin/reports'
    | '/admin/controls';
  ownerOnly?: boolean;
};

export const adminMenuItems: AdminMenuItem[] = [
  {
    id: 'access-requests',
    title: 'Access Requests',
    subtitle: 'Review requests and send email invitations',
    icon: 'users',
    route: '/admin/access-requests',
  },
  {
    id: 'assignment-requests',
    title: 'Assignment Requests',
    subtitle: 'Review shepherd reassignment requests',
    icon: 'user-plus',
    route: '/admin/assignment-requests',
  },
  {
    id: 'users',
    title: 'Users & Roles',
    subtitle: 'Approve access and assign roles',
    icon: 'users',
    route: '/admin/users',
    ownerOnly: true,
  },
  {
    id: 'members',
    title: 'Members',
    subtitle: 'Create and maintain congregation members',
    icon: 'user-plus',
    route: '/admin/members',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    subtitle: 'Create, assign, and close shepherding tasks',
    icon: 'check-square',
    route: '/admin/tasks',
  },
  {
    id: 'reports',
    title: 'Reports & Ops',
    subtitle: 'Organization summaries and platform status',
    icon: 'bar-chart-2',
    route: '/admin/reports',
  },
  {
    id: 'congregations',
    title: 'Congregations',
    subtitle: 'Your district congregations',
    icon: 'users',
    route: '/admin/congregations',
    ownerOnly: true,
  },
  {
    id: 'controls',
    title: 'App Controls',
    subtitle: 'Compliance links and operator references',
    icon: 'settings',
    route: '/admin/controls',
    ownerOnly: true,
  },
];

export function visibleAdminMenuItems(isOwner: boolean) {
  return adminMenuItems.filter((item) => !item.ownerOnly || isOwner);
}
