import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

export function loadEnvFile(filePath = path.join(process.cwd(), '.env')) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

export function resolveRlsLiveConfig(source = process.env) {
  const fileEnv = loadEnvFile();
  const env = { ...fileEnv, ...source };
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    return { ready: false, reason: 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY' };
  }

  return {
    ready: true,
    url,
    key,
    shepherdEmail: env.E2E_EMAIL?.trim() || 'shepherd@test.local',
    shepherdPassword: env.E2E_PASSWORD?.trim() || 'ChangeMe123!',
    adminEmail: env.E2E_ADMIN_EMAIL?.trim() || 'admin@test.local',
    adminPassword: env.E2E_ADMIN_PASSWORD?.trim() || env.E2E_PASSWORD?.trim() || 'ChangeMe123!',
    inactiveEmail: env.E2E_INACTIVE_EMAIL?.trim() || '',
    inactivePassword: env.E2E_INACTIVE_PASSWORD?.trim() || env.E2E_PASSWORD?.trim() || 'ChangeMe123!',
    otherMemberName: env.RLS_OTHER_MEMBER_NAME?.trim() || 'Sarah Mkhize',
    adminTaskTitle: env.RLS_ADMIN_TASK_TITLE?.trim() || 'Admin backlog review',
  };
}

async function signIn(url, key, email, password) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email} sign-in failed: ${error.message}`);
  if (!data.session) throw new Error(`${email} sign-in returned no session`);
  return { client, session: data.session };
}

/**
 * Executes forbidden-operation checks against a configured Supabase project.
 * Requires seeded E2E users/members (see supabase/seed-e2e-data.sql).
 */
export async function runRlsNegativeCases(config) {
  const failures = [];

  const assert = (condition, message) => {
    if (!condition) failures.push(message);
  };

  const { client: shepherdClient, session: shepherdSession } = await signIn(
    config.url,
    config.key,
    config.shepherdEmail,
    config.shepherdPassword,
  );
  const { client: adminClient, session: adminSession } = await signIn(
    config.url,
    config.key,
    config.adminEmail,
    config.adminPassword,
  );

  const shepherdId = shepherdSession.user.id;
  const adminId = adminSession.user.id;

  const { data: adminTokens, error: adminTokensError } = await adminClient
    .from('push_tokens')
    .select('user_id, expo_push_token');

  if (adminTokensError) {
    failures.push(`admin push token read failed: ${adminTokensError.message}`);
  }

  const { data: shepherdTokens, error: shepherdTokensError } = await shepherdClient
    .from('push_tokens')
    .select('user_id, expo_push_token');

  if (shepherdTokensError) {
    failures.push(`shepherd push token read failed unexpectedly: ${shepherdTokensError.message}`);
  } else {
    assert(
      (shepherdTokens ?? []).every((row) => row.user_id === shepherdId),
      `shepherd saw another user's push token(s): ${JSON.stringify(shepherdTokens)}`,
    );

    if (adminTokens?.length) {
      const adminOwned = adminTokens.filter((row) => row.user_id === adminId);
      for (const token of adminOwned) {
        assert(
          !(shepherdTokens ?? []).some((row) => row.expo_push_token === token.expo_push_token),
          `shepherd could read admin push token row ${token.expo_push_token}`,
        );
      }
    }
  }

  const { data: assignedMember, error: assignedMemberError } = await shepherdClient
    .from('members')
    .select('id, full_name')
    .eq('full_name', 'Sipho Dlamini')
    .maybeSingle();

  if (assignedMemberError) {
    failures.push(`shepherd assigned member lookup failed: ${assignedMemberError.message}`);
  } else if (!assignedMember) {
    failures.push('seed member Sipho Dlamini not visible to test shepherd — run supabase/seed-e2e-data.sql');
  } else {
    const { error: spoofVisitError } = await shepherdClient.from('visits').insert({
      member_id: assignedMember.id,
      logged_by: adminId,
      visit_type: 'call',
      notes: 'RLS negative live spoof attempt',
    });
    assert(
      Boolean(spoofVisitError),
      'shepherd visit insert with logged_by != auth.uid() succeeded (RLS bypass)',
    );

    const { data: deletedRows, error: deleteMemberError } = await shepherdClient
      .from('members')
      .delete()
      .eq('id', assignedMember.id)
      .select('id');

    assert(
      Boolean(deleteMemberError) || (deletedRows ?? []).length === 0,
      'shepherd delete on members succeeded (RLS bypass)',
    );
  }

  const { data: otherMember, error: otherMemberError } = await shepherdClient
    .from('members')
    .select('id, full_name')
    .eq('full_name', config.otherMemberName)
    .maybeSingle();

  if (otherMemberError) {
    failures.push(`shepherd other-member lookup errored: ${otherMemberError.message}`);
  } else {
    assert(!otherMember, `shepherd could read member assigned to another shepherd: ${config.otherMemberName}`);
  }

  const { data: adminTask, error: adminTaskError } = await shepherdClient
    .from('tasks')
    .select('id, title')
    .eq('title', config.adminTaskTitle)
    .maybeSingle();

  if (adminTaskError) {
    failures.push(`shepherd admin-task lookup errored: ${adminTaskError.message}`);
  } else {
    assert(!adminTask, `shepherd could read admin-only task: ${config.adminTaskTitle}`);
  }

  const probeClient = createClient(config.url, config.key, { auth: { persistSession: false } });
  const probeEmail = `rls-probe-${Date.now()}@example.invalid`;
  const { data: signupData, error: signupError } = await probeClient.auth.signUp({
    email: probeEmail,
    password: 'ProbeOnly123!',
  });

  if (!signupError && signupData.user) {
    failures.push(
      'public signup succeeded — disable signup in Supabase Dashboard (Authentication → Providers → Email) or run scripts/disable-public-signup.mjs',
    );
  }

  if (config.inactiveEmail) {
    const { client: inactiveClient } = await signIn(
      config.url,
      config.key,
      config.inactiveEmail,
      config.inactivePassword,
    );

    const { data: inactiveMembers, error: inactiveMembersError } = await inactiveClient
      .from('members')
      .select('id')
      .limit(1);

    if (inactiveMembersError) {
      assert(
        inactiveMembersError.message.length > 0,
        `inactive user member read should be denied (got: ${inactiveMembersError.message})`,
      );
    } else {
      assert(
        (inactiveMembers ?? []).length === 0,
        `inactive user could read congregation members: ${JSON.stringify(inactiveMembers)}`,
      );
    }

    const { error: inactiveVisitError } = await inactiveClient.rpc('log_visit', {
      p_member_id: '00000000-0000-4000-8000-000000000001',
      p_visit_type: 'call',
      p_notes: 'inactive probe',
      p_follow_up_required: false,
    });
    assert(
      Boolean(inactiveVisitError),
      'inactive user log_visit RPC succeeded (RLS/security definer bypass)',
    );
  }

  return {
    ok: failures.length === 0,
    failures,
  };
}
