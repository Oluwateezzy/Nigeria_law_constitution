import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  derivePlainText,
  extractSectionMentions,
  indexHash,
  legalTextHash,
  makeContentVersion,
} from '@nigeria-law/domain';
import { extractTocEntries, readConstitutionSource } from './encode/build';
import { contentVersionOf, shippingInstrument } from './load';
import {
  collectInstrumentSections,
  instrumentSchema,
  type Instrument,
} from './schema';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export type OutlineFile = {
  instrumentId: string;
  sectionCount: number;
  headings: { kind: string; heading: string }[];
  sectionOrder: string[];
  tocSectionOrder: string[];
};

export type RegistryFile = {
  instruments: { id: string; shipping?: boolean }[];
};

export type ProvenanceFile = {
  instrumentId?: string;
  name?: string;
  url?: string;
  retrievedOn?: string;
  reuseNote?: string;
  alterations?: string[];
  checker?: string;
  checkedOn?: string;
};

type CheckContext = {
  outline?: OutlineFile;
  registry?: RegistryFile;
  provenance?: ProvenanceFile;
  tocSectionOrder?: string[];
  production?: boolean;
};

function outlineHeadings(
  instrument: Instrument,
): { kind: string; heading: string }[] {
  const headings: { kind: string; heading: string }[] = [];
  const walk = (units: Instrument['units']) => {
    for (const unit of units) {
      const lettered =
        unit.kind === 'part' &&
        !!unit.number &&
        /^[A-Z]{1,2}$/.test(unit.number) &&
        !unit.id.endsWith(`-p${unit.number.toLowerCase()}`);
      if (!lettered) headings.push({ kind: unit.kind, heading: unit.heading });
      if (unit.units) walk(unit.units);
    }
  };
  walk(instrument.units);
  return headings;
}

export function checkProvenance(value: ProvenanceFile | undefined): string[] {
  if (!value) return ['missing provenance'];
  const issues: string[] = [];
  for (const field of [
    'name',
    'url',
    'retrievedOn',
    'reuseNote',
    'checker',
    'checkedOn',
  ] as const) {
    if (!value[field]?.trim()) issues.push(`missing provenance ${field}`);
  }
  if (!value.alterations?.length) issues.push('missing provenance alterations');
  return issues;
}

export function checkInstrument(
  value: unknown,
  context: CheckContext = {},
): string[] {
  const parsed = instrumentSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `schema invalid: ${issue.message}`,
    );
  }
  const instrument = parsed.data;
  const issues: string[] = [];
  const sections = collectInstrumentSections(instrument);
  if (sections.some((section) => section.plainText.trim().length === 0)) {
    issues.push('empty plainText');
  }
  for (const section of sections) {
    const derived = derivePlainText(section.blocks);
    if (derived !== section.plainText) {
      issues.push(
        `plainText does not match the shared derivation for ${section.id}`,
      );
    }
    const mentions = extractSectionMentions(section.plainText).filter(
      (number) => sections.some((item) => item.number === number),
    );
    const expected = mentions.map((number) => `${instrument.id}:s:${number}`);
    const actual = section.crossReferences ?? [];
    if (expected.join('|') !== actual.join('|')) {
      issues.push(`cross-references do not match ${section.id}`);
    }
  }
  const legal = legalTextHash(sections);
  const index = indexHash(sections);
  if (instrument.legalTextHash !== legal)
    issues.push('legal-text hash does not match');
  if (instrument.indexHash !== index) issues.push('index hash does not match');
  const date = instrument.contentVersion.slice(0, 10);
  if (instrument.contentVersion !== makeContentVersion(date, legal)) {
    issues.push('contentVersion does not match the legal-text hash');
  }
  if (context.outline) {
    if (context.outline.instrumentId !== instrument.id) {
      issues.push('outline instrument id does not match');
    }
    if (context.outline.sectionCount !== sections.length) {
      issues.push('section count does not match the outline');
    }
    const order = sections.map((section) => section.number);
    if (order.join('\n') !== context.outline.sectionOrder.join('\n')) {
      issues.push('section out of order against the outline file');
    }
    if (
      JSON.stringify(outlineHeadings(instrument)) !==
      JSON.stringify(context.outline.headings)
    ) {
      issues.push('headings do not match the outline file');
    }
  }
  if (context.tocSectionOrder) {
    const body = sections
      .map((section) => section.number)
      .filter((number) => /^\d+[A-Z]?$/.test(number));
    if (body.join('\n') !== context.tocSectionOrder.join('\n')) {
      issues.push('section out of order against the arrangement of sections');
    }
  }
  issues.push(...checkProvenance(context.provenance));
  if (
    context.provenance?.url &&
    context.provenance.url !== instrument.source.url
  ) {
    issues.push('provenance url does not match the instrument');
  }
  if (context.registry) {
    const entry = context.registry.instruments.find(
      (item) => item.id === instrument.id,
    );
    if (!entry)
      issues.push(`instrument id ${instrument.id} is not in the registry`);
    const shipping = entry?.shipping === true || context.production === true;
    if (shipping && instrument.review.status !== 'reviewed') {
      issues.push('shipping corpus is not reviewed');
    }
  } else if (context.production && instrument.review.status !== 'reviewed') {
    issues.push('shipping corpus is not reviewed');
  }
  if (!instrument.review.status) issues.push('review status missing');
  return issues;
}

export function checkCorpusFiles(): string[] {
  const instrument = shippingInstrument();
  const outline = JSON.parse(
    readFileSync(join(packageRoot, 'sources/cfrn-1999-outline.json'), 'utf8'),
  ) as OutlineFile;
  const registry = JSON.parse(
    readFileSync(join(packageRoot, 'registry.json'), 'utf8'),
  ) as RegistryFile;
  const provenance = JSON.parse(
    readFileSync(
      join(packageRoot, 'sources/cfrn-1999-provenance.json'),
      'utf8',
    ),
  ) as ProvenanceFile;
  const seen = new Set<string>();
  const tocSectionOrder = extractTocEntries(readConstitutionSource())
    .map((entry) => entry.number)
    .filter((number) => {
      if (seen.has(number)) return false;
      seen.add(number);
      return true;
    });
  const issues = checkInstrument(instrument, {
    outline,
    registry,
    provenance,
    tocSectionOrder,
  });
  if (contentVersionOf() !== instrument.contentVersion) {
    issues.push('contentVersionOf does not return the instrument version');
  }
  return issues;
}
