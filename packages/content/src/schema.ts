import { z } from 'zod';

export const contentSchemaVersion = 1;
export const content_schema_version = contentSchemaVersion;

const blockType = z.enum([
  'subsection',
  'paragraph',
  'subparagraph',
  'proviso',
  'paragraph_text',
  'table',
]);

export type Block = {
  type: z.infer<typeof blockType>;
  marker: string;
  anchor: string;
  text: string;
  blocks?: Block[];
  rows?: string[][];
};

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z
    .object({
      type: blockType,
      marker: z.string(),
      anchor: z.string().min(1),
      text: z.string(),
      blocks: z.array(blockSchema).optional(),
      rows: z.array(z.array(z.string())).optional(),
    })
    .superRefine((block, ctx) => {
      if (block.type === 'table' && (!block.rows || block.rows.length === 0)) {
        ctx.addIssue({ code: 'custom', message: 'table block has no rows' });
      }
    }),
);

export type Section = {
  id: string;
  number: string;
  heading?: string;
  blocks: Block[];
  plainText: string;
  aliases?: string[];
  crossReferences?: string[];
};

export const sectionSchema: z.ZodType<Section> = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  heading: z.string().min(1).optional(),
  blocks: z.array(blockSchema).min(1),
  plainText: z.string().min(1),
  aliases: z.array(z.string().min(1)).optional(),
  crossReferences: z.array(z.string().min(1)).optional(),
});

export type Unit = {
  id: string;
  kind: 'chapter' | 'part' | 'schedule';
  number?: string;
  heading: string;
  units?: Unit[];
  sections?: Section[];
};

export const unitSchema: z.ZodType<Unit> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    kind: z.enum(['chapter', 'part', 'schedule']),
    number: z.string().min(1).optional(),
    heading: z.string().min(1),
    units: z.array(unitSchema).optional(),
    sections: z.array(sectionSchema).optional(),
  }),
);

export type Instrument = {
  content_schema_version: number;
  id: string;
  kind: 'constitution' | 'act';
  title: string;
  shortTitle: string;
  citation: string;
  year: number;
  commencement: string | null;
  extent: string;
  versionLabel: string;
  contentVersion: string;
  legalTextHash: string;
  indexHash: string;
  alterations: string[];
  structureNote?: string;
  source: {
    name: string;
    url: string;
    retrievedOn: string;
    reuseNote: string;
  };
  review: {
    status: 'draft' | 'reviewed';
    reviewedOn?: string;
    reviewer?: string;
  };
  units: Unit[];
};

function collectSections(units: readonly Unit[]): Section[] {
  const sections: Section[] = [];
  for (const unit of units) {
    sections.push(...(unit.sections ?? []));
    sections.push(...collectSections(unit.units ?? []));
  }
  return sections;
}

function walkAnchors(blocks: readonly Block[], visit: (block: Block) => void) {
  for (const block of blocks) {
    visit(block);
    if (block.blocks) walkAnchors(block.blocks, visit);
  }
}

export const instrumentSchema: z.ZodType<Instrument> = z
  .object({
    content_schema_version: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    kind: z.enum(['constitution', 'act']),
    title: z.string().min(1),
    shortTitle: z.string().min(1),
    citation: z.string().min(1),
    year: z.number().int(),
    commencement: z.string().min(1).nullable(),
    extent: z.string(),
    versionLabel: z.string().min(1),
    contentVersion: z.string().min(1),
    legalTextHash: z.string().regex(/^[a-f0-9]{64}$/),
    indexHash: z.string().regex(/^[a-f0-9]{64}$/),
    alterations: z.array(z.string().min(1)),
    structureNote: z.string().min(1).optional(),
    source: z.object({
      name: z.string().min(1),
      url: z.string().url(),
      retrievedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reuseNote: z.string().min(1),
    }),
    review: z.object({
      status: z.enum(['draft', 'reviewed']),
      reviewedOn: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      reviewer: z.string().min(1).optional(),
    }),
    units: z.array(unitSchema).min(1),
  })
  .superRefine((instrument, ctx) => {
    if (instrument.kind === 'act' && instrument.extent.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'missing extent on an Act' });
    }
    if (instrument.review.status === 'reviewed') {
      if (!instrument.review.reviewedOn || !instrument.review.reviewer) {
        ctx.addIssue({
          code: 'custom',
          message: 'review status missing reviewer',
        });
      }
    }
    const seen = new Set<string>();
    for (const section of collectSections(instrument.units)) {
      if (seen.has(section.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `duplicate section id ${section.id}`,
        });
      }
      seen.add(section.id);
      if (section.id !== `${instrument.id}:s:${section.number}`) {
        ctx.addIssue({
          code: 'custom',
          message: `section id ${section.id} does not match ${instrument.id}:s:${section.number}`,
        });
      }
      const anchors = new Set<string>();
      walkAnchors(section.blocks, (block) => {
        if (anchors.has(block.anchor)) {
          ctx.addIssue({
            code: 'custom',
            message: `duplicate anchor ${block.anchor} in ${section.id}`,
          });
        }
        anchors.add(block.anchor);
        if (
          block.type === 'subsection' &&
          block.anchor !== `sub-${block.marker}`
        ) {
          ctx.addIssue({
            code: 'custom',
            message: `subsection anchor ${block.anchor} is not sub-${block.marker}`,
          });
        }
      });
    }
  });

export function collectInstrumentSections(instrument: Instrument): Section[] {
  return collectSections(instrument.units);
}
