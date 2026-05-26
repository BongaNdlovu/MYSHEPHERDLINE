export const testIds = {
  landing: {
    title: 'landing-title',
    signIn: 'landing-sign-in',
    signUp: 'landing-sign-up',
    privacy: 'landing-privacy',
  },
  auth: {
    email: 'auth-email',
    password: 'auth-password',
    displayName: 'auth-display-name',
    signInButton: 'auth-sign-in-button',
    signUpButton: 'auth-sign-up-button',
  },
  tabs: {
    home: 'tab-home',
    members: 'tab-members',
    tasks: 'tab-tasks',
    reports: 'tab-reports',
    more: 'tab-more',
  },
  home: {
    screen: 'home-screen',
    attentionList: 'home-attention-list',
  },
  members: {
    screen: 'members-screen',
    search: 'members-search',
    filter: (value: string) => `members-filter-${value}`,
    member: (id: string) => `member-item-${id}`,
  },
  memberProfile: {
    screen: 'member-profile-screen',
    logVisit: 'member-log-visit',
  },
  logVisit: {
    screen: 'log-visit-screen',
    save: 'log-visit-save',
    notes: 'log-visit-notes',
    type: (value: string) => `log-visit-type-${value}`,
  },
  tasks: {
    screen: 'tasks-screen',
    toggle: (id: string) => `task-toggle-${id}`,
  },
  reports: {
    screen: 'reports-screen',
    summary: 'reports-summary',
  },
  more: {
    screen: 'more-screen',
    signOut: 'more-sign-out',
    privacy: 'more-privacy',
  },
  toast: 'app-toast',
} as const;
