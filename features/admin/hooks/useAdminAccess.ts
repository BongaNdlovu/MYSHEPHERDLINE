import { useAuth } from '@/lib/core/auth';
import { isAppAdmin } from '@/features/admin/selectors/guard';

export function useAdminAccess() {
  const { profile, loading } = useAuth();
  return {
    loading,
    isAdmin: isAppAdmin(profile),
    profile,
  };
}
