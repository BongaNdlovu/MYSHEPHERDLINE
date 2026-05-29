import { useAuth } from '@/lib/core/auth';
import { isOperationalAdmin, isOwner } from '@/features/admin/selectors/guard';

export function useAdminAccess() {
  const { profile, loading, profileLoading } = useAuth();
  return {
    loading: loading || profileLoading,
    isAdmin: isOperationalAdmin(profile),
    isOwner: isOwner(profile),
    profile,
  };
}
