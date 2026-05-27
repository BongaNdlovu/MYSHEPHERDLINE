import { AppException, createAppError, fromSupabaseError } from '@/lib/core/errors';
import { requireSupabase } from '@/lib/core/supabase';

export async function getCurrentOrganizationId(): Promise<string> {
  const supabase = requireSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    throw new AppException(fromSupabaseError(authError, 'Unable to verify your session.'));
  }

  const userId = authData.user?.id;
  if (!userId) {
    throw new AppException(createAppError('auth', 'Sign in to continue.'));
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new AppException(fromSupabaseError(error, 'Unable to resolve your organization.'));
  }

  if (!data?.organization_id) {
    throw new AppException(createAppError('auth', 'Your profile is missing an organization.'));
  }

  return data.organization_id;
}
