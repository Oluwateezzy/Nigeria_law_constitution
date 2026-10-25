import { completeHostedProvision, QuotaBook } from '../../../packages/domain/src/hosted-complete.ts';
import { hostedModelId } from '../../../packages/domain/src/own-key.ts';
import instrument from '../../../packages/content/corpus/cfrn-1999.js';

type SectionNode = {
  id?: string;
  heading?: string;
  number?: string;
  plainText?: string;
  sections?: SectionNode[];
  units?: SectionNode[];
  kind?: string;
};

type InstrumentNode = SectionNode & {
  citation?: string;
  extent?: string;
  contentVersion?: string;
  shortTitle?: string;
};

const book = new QuotaBook();

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ code: 'provider_error' }, 405);
  }
  const body = (await request.json()) as {
    kind?: string;
    installId?: string;
    sectionId?: string;
    messages?: { role: 'user' | 'assistant'; content: string }[];
  };
  if (body.kind !== 'provision' || !body.sectionId || !body.installId) {
    return json({ code: 'payload_too_large' }, 400);
  }
  const loaded = findSection(instrument as InstrumentNode, body.sectionId);
  const result = await completeHostedProvision(
    {
      kind: 'provision',
      installId: body.installId,
      userId: null,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0',
      lane: 'free',
      contentVersion: (instrument as InstrumentNode).contentVersion ?? '',
      sectionId: body.sectionId,
      messages: body.messages ?? [],
      now: new Date(),
    },
    {
      loadSection: () => loaded,
      provider: {
        async complete(prompt) {
          const key = Deno.env.get('HOSTED_MODEL_KEY');
          if (!key) throw new Error('missing hosted model key');
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: hostedModelId,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: prompt.system },
                ...prompt.messages,
              ],
            }),
          });
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
      },
      book,
      logs: [],
    },
  );
  if (!result.ok) return json({ code: result.code, quota: result.quota }, 400);
  return json(result, 200);
});

function findSection(root: InstrumentNode, id: string) {
  const found = walk(root, []);
  const match = found.find((item) => item.id === id);
  if (!match?.plainText) return null;
  return {
    id: match.id,
    plainText: match.plainText,
    path: match.path,
    citation: root.citation ?? '',
    extent: root.extent ?? '',
    contentVersion: root.contentVersion ?? '',
  };
}

function walk(
  node: SectionNode,
  trail: string[],
): { id: string; plainText: string; path: string }[] {
  const rows: { id: string; plainText: string; path: string }[] = [];
  const label = node.heading || node.number || node.kind || '';
  const next = label ? [...trail, label] : trail;
  if (node.id && node.plainText) {
    rows.push({ id: node.id, plainText: node.plainText, path: next.join(' / ') });
  }
  for (const child of [...(node.units ?? []), ...(node.sections ?? [])]) {
    rows.push(...walk(child, next));
  }
  return rows;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
