import type { SupabaseClient } from '@supabase/supabase-js';

import { logAudit } from './logger';
import type { ReportSummary } from './reports';

export type PushDeliveryResult = {
  requested: number;
  sent: number;
  failed: number;
  batches: number;
  deactivated: number;
  error?: string;
};

type ExpoTicket = {
  status?: string;
  message?: string;
  details?: { error?: string };
};

type ExpoPushMessage = {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: Record<string, string>;
};

type TicketCounts = {
  sent: number;
  failed: number;
  deadTokens: string[];
};

const EXPO_PUSH_CHUNK_SIZE = 100;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_PUSH_MAX_ATTEMPTS = 3;
const EXPO_PUSH_RETRY_BASE_MS = 250;
const DEAD_TOKEN_ERRORS = new Set(['DeviceNotRegistered', 'InvalidCredentials', 'MismatchSenderId']);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryExpoStatus(status: number) {
  return status === 429 || status >= 500;
}

function digestBody(summary: ReportSummary) {
  return `${summary.membersNeedingAttention} people need care today. ${summary.tasksOpen} follow-ups are still open.`;
}

function chunkTokens(tokens: string[], chunkSize = EXPO_PUSH_CHUNK_SIZE) {
  const chunks: string[][] = [];
  for (let index = 0; index < tokens.length; index += chunkSize) {
    chunks.push(tokens.slice(index, index + chunkSize));
  }
  return chunks;
}

export function parseTicketCounts(chunk: string[], payload: unknown): TicketCounts {
  if (!payload || typeof payload !== 'object') {
    return { sent: 0, failed: chunk.length, deadTokens: [] };
  }

  const data = (payload as { data?: ExpoTicket[] }).data;
  if (!Array.isArray(data) || data.length !== chunk.length) {
    return { sent: 0, failed: chunk.length, deadTokens: [] };
  }

  let sent = 0;
  let failed = 0;
  const deadTokens: string[] = [];

  data.forEach((ticket, index) => {
    if (ticket.status === 'ok') {
      sent += 1;
      return;
    }

    failed += 1;
    const ticketError = ticket.details?.error ?? ticket.message ?? 'unknown';
    if (DEAD_TOKEN_ERRORS.has(ticketError)) {
      deadTokens.push(chunk[index]);
    }
  });

  return { sent, failed, deadTokens };
}

export async function deactivatePushTokens(supabase: SupabaseClient | undefined, tokens: string[]) {
  if (!supabase || !tokens.length) return 0;

  const { error } = await supabase
    .from('push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in('expo_push_token', tokens);

  if (error) {
    logAudit(
      { requestId: 'push-delivery', method: 'POST', path: '/notifications/digest' },
      'push_token_deactivate_failed',
      { count: tokens.length, message: error.message },
    );
    return 0;
  }

  return tokens.length;
}

export async function sendExpoMessages(messages: ExpoPushMessage[]) {
  let lastError = 'Expo push network failure';

  for (let attempt = 1; attempt <= EXPO_PUSH_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        lastError = `Expo push API returned ${response.status}`;
        if (shouldRetryExpoStatus(response.status) && attempt < EXPO_PUSH_MAX_ATTEMPTS) {
          await sleep(EXPO_PUSH_RETRY_BASE_MS * attempt);
          continue;
        }
        return { ok: false as const, error: lastError };
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { ok: false as const, error: 'Expo push API returned invalid JSON' };
      }

      return { ok: true as const, payload };
    } catch {
      lastError = 'Expo push network failure';
      if (attempt < EXPO_PUSH_MAX_ATTEMPTS) {
        await sleep(EXPO_PUSH_RETRY_BASE_MS * attempt);
        continue;
      }
    }
  }

  return { ok: false as const, error: lastError };
}

export async function sendExpoPushBatch(
  expoPushTokens: string[],
  summary: ReportSummary,
  options?: { supabase?: SupabaseClient },
): Promise<PushDeliveryResult> {
  if (!expoPushTokens.length) {
    return { requested: 0, sent: 0, failed: 0, batches: 0, deactivated: 0 };
  }

  const chunks = chunkTokens(expoPushTokens);
  let requested = 0;
  let sent = 0;
  let failed = 0;
  let batches = 0;
  let lastError: string | undefined;
  const deadTokens: string[] = [];

  for (const chunk of chunks) {
    requested += chunk.length;
    const messages = chunk.map((token) => ({
      to: token,
      sound: 'default' as const,
      title: 'Today Care List',
      body: digestBody(summary),
    }));

    const response = await sendExpoMessages(messages);
    if (!response.ok) {
      failed += chunk.length;
      lastError = response.error;
      continue;
    }

    const counts = parseTicketCounts(chunk, response.payload);
    sent += counts.sent;
    failed += counts.failed;
    deadTokens.push(...counts.deadTokens);
    batches += 1;
  }

  const deactivated = await deactivatePushTokens(options?.supabase, deadTokens);

  if (deadTokens.length) {
    logAudit(
      { requestId: 'push-delivery', method: 'POST', path: '/notifications/digest' },
      'push_ticket_errors',
      { dead: deadTokens.length, deactivated },
    );
  }

  return { requested, sent, failed, batches, deactivated, error: lastError };
}
