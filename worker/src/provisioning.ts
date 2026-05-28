import type { SupabaseClient } from '@supabase/supabase-js';

import type { AuthContext } from './auth';
import { hasGlobalScope } from './auth';
import { logAudit, type RequestContext } from './logger';

const INVITE_REDIRECT_TO = 'myshepherdline://sign-in';

type InvitePayload = {
  accessRequestId?: unknown;
};

export function parseInvitePayload(body: unknown): { accessRequestId: string } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' };

  const accessRequestId = (body as InvitePayload).accessRequestId;
  if (typeof accessRequestId !== 'string' || !accessRequestId.trim()) {
    return { error: 'accessRequestId is required' };
  }

  return { accessRequestId: accessRequestId.trim() };
}

export type InviteAccessRequestResult =
  | { ok: true; email: string }
  | { error: string; status: 400 | 403 | 404 | 409 | 500 };

export async function inviteAccessRequest(
  supabase: SupabaseClient,
  auth: AuthContext,
  accessRequestId: string,
  requestContext: RequestContext,
): Promise<InviteAccessRequestResult> {
  if (!hasGlobalScope(auth)) {
    return { error: 'Forbidden', status: 403 };
  }

  const { data: request, error: requestError } = await supabase
    .from('access_requests')
    .select('*')
    .eq('id', accessRequestId)
    .maybeSingle();

  if (requestError) return { error: 'Unable to load access request', status: 500 };
  if (!request) return { error: 'Access request not found', status: 404 };
  if (request.status !== 'pending') return { error: 'Access request is no longer pending', status: 409 };
  if (!request.preferred_organization_id) {
    return { error: 'Congregation must be selected before sending an invite', status: 400 };
  }

  const email = String(request.email).trim().toLowerCase();
  const displayName = String(request.display_name).trim();

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: INVITE_REDIRECT_TO,
    data: {
      display_name: displayName,
      organization_id: request.preferred_organization_id,
      preferred_district_id: request.preferred_district_id,
      preferred_organization_id: request.preferred_organization_id,
      role: 'shepherd',
      is_active: true,
    },
  });

  if (inviteError) {
    const message = inviteError.message.toLowerCase();
    if (message.includes('already') || message.includes('registered')) {
      return { error: 'A user with this email already exists', status: 409 };
    }
    return { error: 'Unable to send invitation email', status: 500 };
  }

  const invitedUserId = inviteData.user?.id;
  if (invitedUserId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: request.preferred_organization_id,
        preferred_district_id: request.preferred_district_id,
        preferred_organization_id: request.preferred_organization_id,
        display_name: displayName,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitedUserId);
    if (profileError) {
      return { error: 'Invitation sent but profile setup failed', status: 500 };
    }
  }

  const { error: updateError } = await supabase
    .from('access_requests')
    .update({ status: 'reviewed' })
    .eq('id', accessRequestId);

  if (updateError) return { error: 'Invitation sent but request status was not updated', status: 500 };

  logAudit(requestContext, 'access_request_invited', {
    accessRequestId,
    email,
    organizationId: request.preferred_organization_id,
    actorId: auth.userId,
  });

  return { ok: true, email };
}
