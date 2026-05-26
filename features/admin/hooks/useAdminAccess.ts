import { useAuth } from '@/lib/core/auth';
import { isOperationalAdmin, isOwner } from '@/features/admin/selectors/guard';

export function useAdminAccess() {
  const { profile, loading } = useAuth();
  return {
    loading,
    isAdmin: isOperationalAdmin(profile),
    isOwner: isOwner(profile),
    profile,
  };
}
