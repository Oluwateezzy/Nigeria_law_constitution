import {
  findSection,
  readerPathLabel,
} from '../../../packages/content/src/walk.ts';
import {
  completeHostedProvision,
  completeHostedScenario,
  QuotaBook,
  type HostedErrorCode,
  type ProxyLog,
} from '../../../packages/domain/src/hosted-complete.ts';
import { lagosDay } from '../../../packages/domain/src/lagos-day.ts';
import { hostedModelId } from '../../../packages/domain/src/own-key.ts';
import { sha256 } from '../../../packages/domain/src/sha256.ts';
import { shippingInstruments } from '../../../packages/content/src/load.ts';

type QuotaKind = 'install' | 'user' | 'ip';

const loadedInstruments = shippingInstruments();
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ code: 'provider_error' }, 405);
  let body: {
    kind?: string;
    installId?: string;
    contentVersion?: string;
    sectionId?: string;
    retrievedSectionIds?: string[];
    messages?: { role: 'user' | 'assistant'; content: string }[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ code: 'payload_too_large' }, 400);
  }
  const scenarioIds = (body.retrievedSectionIds ?? []).filter(
    (id) => typeof id === 'string',
  );
  if (
    !body.installId ||
    !uuidPattern.test(body.installId) ||
    (body.kind !== 'provision' && body.kind !== 'scenario') ||
    (body.kind === 'provision' && !body.sectionId) ||
    (body.kind === 'scenario' && scenarioIds.length === 0)
  ) {
    return json({ code: 'payload_too_large' }, 400);
  }
  const now = new Date();
  const day = lagosDay(now);
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  const ipId = uuidFromHash(sha256(`ip|${ip}`));
  const userId = await signedInUser(request);
  const env = serviceEnv();
  const installCount = await readCount(env, body.installId, 'install', day);
  const userCount = userId ? await readCount(env, userId, 'user', day) : 0;
  const ipCount = await readCount(env, ipId, 'ip', day);
  const folded = userId
    ? await hasFold(env, userId, body.installId, day)
    : false;
  const book = new QuotaBook();
  book.seedInstall(body.installId, now, installCount);
  book.seedIp(ip, now, ipCount);
  if (userId) {
    book.seedUser(userId, now, userCount);
    if (folded) book.markFolded(userId, body.installId, now);
  }
  const logs: ProxyLog[] = [];
  const lane = await laneFor(env, userId);
  const result =
    body.kind === 'scenario'
      ? await completeHostedScenario(
          {
            kind: 'scenario',
            installId: body.installId,
            userId,
            ip,
            lane,
            contentVersion:
              loadedInstruments[0]?.contentVersion ?? body.contentVersion ?? '',
            sectionIds: scenarioIds,
            messages: body.messages ?? [],
            now,
          },
          {
            loadSection: (id) => loadedSection(id),
            provider: openAiProvider(),
            book,
            logs,
          },
        )
      : await completeHostedProvision(
          {
            kind: 'provision',
            installId: body.installId,
            userId,
            ip,
            lane,
            contentVersion:
              body.contentVersion ?? loadedInstruments[0]?.contentVersion ?? '',
            sectionId: body.sectionId ?? '',
            messages: body.messages ?? [],
            now,
          },
          {
            loadSection: () =>
              body.sectionId ? loadedSection(body.sectionId) : null,
            provider: openAiProvider(),
            book,
            logs,
          },
        );
  for (const line of logs) console.log(JSON.stringify(line));
  if (result.ok) {
    await persistQuota(env, {
      userId,
      installId: body.installId,
      ipId,
      day,
      used: result.quota.used,
      ipCount: ipCount + 1,
    });
  }
  const quota = {
    lane: result.quota.lane,
    remaining: result.quota.remaining,
    limit: result.quota.limit,
    resetsAt: result.quota.resetsAt,
  };
  if (!result.ok)
    return json({ code: result.code, quota }, statusFor(result.code));
  return json(
    {
      contentVersion: result.contentVersion,
      message: result.message,
      quota,
    },
    200,
  );
});

function findLoaded(id: string) {
  for (const instrument of loadedInstruments) {
    const located = findSection(instrument, id);
    if (located) return { instrument, located };
  }
  return null;
}

function loadedSection(id: string) {
  const found = findLoaded(id);
  if (!found) return null;
  return {
    id: found.located.section.id,
    plainText: found.located.section.plainText,
    path: readerPathLabel(found.instrument.shortTitle, found.located.trail),
    citation: found.instrument.citation,
    extent: found.instrument.extent,
    contentVersion: found.instrument.contentVersion,
  };
}

function openAiProvider() {
  return {
    async complete(prompt: {
      system: string;
      messages: { role: string; content: string }[];
    }) {
      const key = Deno.env.get('HOSTED_MODEL_KEY');
      if (!key) throw new Error('missing hosted model key');
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: hostedModelId,
            max_tokens: 800,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: prompt.system },
              ...prompt.messages,
            ],
          }),
        },
      );
      if (!response.ok) throw new Error('provider status');
      const payload = (await response.json()) as {
        usage?: { total_tokens?: number };
        choices?: { message?: { content?: string } }[];
      };
      return {
        text: payload.choices?.[0]?.message?.content ?? '',
        tokens: payload.usage?.total_tokens ?? 0,
      };
    },
  };
}

function statusFor(code: HostedErrorCode): number {
  if (code === 'quota_exceeded' || code === 'entitlement_required') return 429;
  if (code === 'content_unknown_section') return 404;
  if (code === 'payload_too_large') return 413;
  if (code === 'unauthorized') return 401;
  return 502;
}

function serviceEnv(): { url: string; service: string; anon: string } | null {
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !service || !anon) return null;
  return { url, service, anon };
}

async function signedInUser(request: Request): Promise<string | null> {
  const env = serviceEnv();
  const header = request.headers.get('Authorization');
  if (!env || !header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  if (token === env.anon || token === env.service) return null;
  const response = await fetch(`${env.url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.anon },
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { id?: string };
  return payload.id && uuidPattern.test(payload.id) ? payload.id : null;
}

async function laneFor(
  env: { url: string; service: string; anon: string } | null,
  userId: string | null,
): Promise<'free' | 'plus'> {
  if (!env || !userId) return 'free';
  const rows = await restGet(
    env,
    `entitlements?subject_id=eq.${userId}&subject_kind=eq.user&lane=eq.plus&select=expires_at`,
  );
  const expires = rows[0]?.expires_at;
  if (!rows[0]) return 'free';
  if (typeof expires === 'string' && new Date(expires).getTime() <= Date.now())
    return 'free';
  return 'plus';
}

async function readCount(
  env: { url: string; service: string; anon: string } | null,
  subjectId: string,
  kind: QuotaKind,
  day: string,
): Promise<number> {
  if (!env) return 0;
  const rows = await restGet(
    env,
    `quota_usage?subject_id=eq.${subjectId}&subject_kind=eq.${kind}&lagos_date=eq.${day}&select=hosted_count`,
  );
  const count = rows[0]?.hosted_count;
  return typeof count === 'number' ? count : 0;
}

async function hasFold(
  env: { url: string; service: string; anon: string } | null,
  userId: string,
  installId: string,
  day: string,
): Promise<boolean> {
  if (!env) return false;
  const rows = await restGet(
    env,
    `quota_folds?user_id=eq.${userId}&install_id=eq.${installId}&lagos_date=eq.${day}&select=user_id`,
  );
  return rows.length > 0;
}

async function persistQuota(
  env: { url: string; service: string; anon: string } | null,
  input: {
    userId: string | null;
    installId: string;
    ipId: string;
    day: string;
    used: number;
    ipCount: number;
  },
): Promise<void> {
  if (!env) return;
  if (input.userId) {
    await restUpsert(env, 'quota_usage', {
      subject_id: input.userId,
      subject_kind: 'user',
      lagos_date: input.day,
      hosted_count: input.used,
    });
    await restUpsert(env, 'quota_folds', {
      user_id: input.userId,
      install_id: input.installId,
      lagos_date: input.day,
    });
  } else {
    await restUpsert(env, 'quota_usage', {
      subject_id: input.installId,
      subject_kind: 'install',
      lagos_date: input.day,
      hosted_count: input.used,
    });
  }
  await restUpsert(env, 'quota_usage', {
    subject_id: input.ipId,
    subject_kind: 'ip',
    lagos_date: input.day,
    hosted_count: input.ipCount,
  });
}

async function restGet(
  env: { url: string; service: string },
  query: string,
): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(`${env.url}/rest/v1/${query}`, {
      headers: serviceHeaders(env),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as unknown;
    return Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

async function restUpsert(
  env: { url: string; service: string },
  table: string,
  row: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`${env.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        ...serviceHeaders(env),
        'content-type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });
  } catch {
    // A missing table leaves the answer in place. The count stays on this request's book.
  }
}

function serviceHeaders(env: { service: string }): Record<string, string> {
  return {
    apikey: env.service,
    Authorization: `Bearer ${env.service}`,
  };
}

function uuidFromHash(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
