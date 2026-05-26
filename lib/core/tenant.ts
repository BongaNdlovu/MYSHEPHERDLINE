import { requireSupabase } from '@/lib/core/supabase';

export async function getCurrentOrganizationId(): Promise<string | null> {
  const supabase = requireSupabase();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .maybeSingle();

  return data?.organization_id ?? null;
}
