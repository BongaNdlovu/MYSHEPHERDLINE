export type OwnerRouteState = {
  loading: boolean;
  isOwner: boolean;
};

export function shouldRedirectFromOwnerRoute(state: OwnerRouteState): boolean {
  return !state.loading && !state.isOwner;
}

export function canRenderOwnerRouteContent(state: OwnerRouteState): boolean {
  return !state.loading && state.isOwner;
}

export type AdminLayoutState = {
  loading: boolean;
  isAdmin: boolean;
  onUnauthorizedScreen: boolean;
};

export function shouldRedirectFromAdminLayout(state: AdminLayoutState): boolean {
  return !state.onUnauthorizedScreen && !state.loading && !state.isAdmin;
}

export function canRenderAdminLayout(state: AdminLayoutState): boolean {
  return state.onUnauthorizedScreen || (!state.loading && state.isAdmin);
}
