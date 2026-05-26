import { createClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RECENT_ACTIVITY_DAYS?: string;
}

type ReportSummary = {
  membersNeedingAttention: number;
  visitsCompleted: number;
  tasksOpen: number;
  recentActivityDays: number;
  visitBreakdown: {
    visits: number;
    calls: number;
    bibleStudies: number;
    newConverts: number;
  };
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function unauthorized() {
  return json({ error: 'Unauthorized' }, 401);
}

async function getUserId(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function buildSummary(env: Env): Promise<ReportSummary> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const recentDays = Number(env.RECENT_ACTIVITY_DAYS ?? '7');
  const since = new Date();
  since.setDate(since.getDate() - recentDays);

  const [membersResult, visitsResult, tasksResult] = await Promise.all([
    supabase.from('members').select('risk_level, status'),
    supabase.from('visits').select('visit_type, visited_at').gte('visited_at', since.toISOString()),
    supabase.from('tasks').select('status').eq('status', 'open'),
  ]);

  const members = membersResult.data ?? [];
  const visits = visitsResult.data ?? [];
  const tasks = tasksResult.data ?? [];

  const membersNeedingAttention = members.filter(
    (member) =>
      member.risk_level === 'high' ||
      member.status === 'inactive' ||
      member.status === 'new',
  ).length;

  const visitBreakdown = visits.reduce(
    (acc, visit) => {
      if (visit.visit_type === 'visit') acc.visits += 1;
      if (visit.visit_type === 'call') acc.calls += 1;
      if (visit.visit_type === 'bible_study') acc.bibleStudies += 1;
      if (visit.visit_type === 'other') acc.newConverts += 1;
      return acc;
    },
    { visits: 0, calls: 0, bibleStudies: 0, newConverts: 0 },
  );

  return {
    membersNeedingAttention,
    visitsCompleted: visits.length,
    tasksOpen: tasks.length,
    recentActivityDays: recentDays,
    visitBreakdown,
  };
}

async function registerToken(request: Request, env: Env, userId: string) {
  const body = (await request.json()) as { expoPushToken?: string; deviceName?: string };
  if (!body.expoPushToken) return json({ error: 'expoPushToken is required' }, 400);

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: body.expoPushToken,
      device_name: body.deviceName ?? null,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

async function sendDigest(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const summary = await buildSummary(env);
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('expo_push_token')
    .eq('is_active', true);

  const messages = (tokens ?? []).map((token) => ({
    to: token.expo_push_token,
    sound: 'default',
    title: 'MyShepherdLine digest',
    body: `${summary.membersNeedingAttention} members need attention. ${summary.tasksOpen} open tasks.`,
  }));

  if (!messages.length) return json({ sent: 0 });

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  return json({ sent: messages.length, result });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ status: 'healthy', service: 'myshepherdline-api' });
    }

    if (url.pathname === '/reports/summary' && request.method === 'GET') {
      const userId = await getUserId(request, env);
      if (!userId) return unauthorized();
      const summary = await buildSummary(env);
      return json(summary);
    }

    if (url.pathname === '/notifications/register' && request.method === 'POST') {
      const userId = await getUserId(request, env);
      if (!userId) return unauthorized();
      return registerToken(request, env, userId);
    }

    if (url.pathname === '/notifications/send-digest' && request.method === 'POST') {
      const userId = await getUserId(request, env);
      if (!userId) return unauthorized();
      return sendDigest(env);
    }

    return json({ error: 'Not found' }, 404);
  },
};
