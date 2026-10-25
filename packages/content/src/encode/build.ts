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
import { outlineHeadings } from '../outline-headings';
import provenanceJson from '../../sources/cfrn-1999-provenance.json';
import {
  collectInstrumentSections,
  type Block,
  type Instrument,
  type Section,
  type Unit,
} from '../schema';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = join(root, 'sources/plac-cfrn-1999.txt');

const FURNITURE =
  /\d{1,3}\s+The Constitution of the Federal Republic of Nigeria Updated with the First, Second, Third, Fourth and Fifth Alterations|The Constitution of the Federal Republic of Nigeria Updated with the First, Second, Third, Fourth and Fifth Alterations\s+\d{1,3}/g;

const REPAIRS: [string, string][] = [
  ['Indus trial', 'Industrial'],
  ['estab lishment', 'establishment'],
];

const ROMANS = [
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x',
  'xi',
  'xii',
  'xiii',
  'xiv',
  'xv',
  'xvi',
  'xvii',
  'xviii',
  'xix',
  'xx',
];

const STATES = [
  'Akwa Ibom',
  'Cross River',
  'Abia',
  'Adamawa',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const COUNCILS = [
  'Abaji',
  'Abuja Municipal',
  'Bwari',
  'Gwagwalada',
  'Kuje',
  'Kwali',
];

type TocEntry = { number: string; heading: string };

type Item =
  | { kind: 'chapter'; number: string; heading: string; extra: string }
  | { kind: 'part'; number: string; heading: string; extra: string }
  | { kind: 'group'; marker: string; heading: string; extra: string }
  | { kind: 'schedule'; name: string; heading: string }
  | { kind: 'section'; number: string; text: string }
  | { kind: 'prose'; text: string };

export function readConstitutionSource(): string {
  return readFileSync(sourcePath, 'utf8');
}

function repair(text: string): string {
  let next = text;
  for (const [from, to] of REPAIRS) next = next.replaceAll(from, to);
  return next;
}

function cleanSource(raw: string): string {
  let text = raw.replace(
    '[First Schedule, Part Kano',
    'Kano\n[First Schedule, Part',
  );
  text = text.replace(FURNITURE, '\n');
  text = text.replace(/\[[\s\S]{0,1500}?\]/g, (match) =>
    /Alteration|substituted|inserted|deleted|altered|Cap\.|Schedule|Section|Definition|paragraph/i.test(
      match,
    )
      ? '\n'
      : match,
  );
  text = text.replace(/(?<=[.;])\s+([A-Z]{1,2}\s*-\s+)/g, '\n$1');
  text = text.replace(/(?<=[.;])\s+(PART\s+[IVXLC]+\b)/g, '\n$1');
  text = text.replace(/(?<=[.;])\s+(CHAPTER\s+[IVXLC]+\b)/g, '\n$1');
  text = text.replace(
    /(?<=[.;])\s+((?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH)\s+SCHEDULE\b)/g,
    '\n$1',
  );
  const about = text.search(/\n#{0,6}\s*About PLAC\b/);
  if (about > 0) text = text.slice(0, about);
  return text;
}

export function extractTocEntries(raw: string): TocEntry[] {
  const cleaned = cleanSource(raw);
  const start = cleaned.indexOf('ARRANGEMENT OF SECTIONS');
  const end = cleaned.indexOf(
    'WE the people of the Federal Republic of Nigeria',
  );
  let toc = cleaned.slice(start, end).replace(/\|/g, ' ').replace(/\s+/g, ' ');
  const matches = [...toc.matchAll(/(\d+[A-Z]?)\.\s+/g)];
  const entries: TocEntry[] = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]!;
    const from = (match.index ?? 0) + match[0].length;
    const to = matches[index + 1]?.index ?? toc.length;
    let heading = toc.slice(from, to).trim();
    heading = heading.replace(/\s+\d+\s*$/, '').trim();
    heading = heading
      .replace(
        /\s+(?:CHAPTER|PART|SCHEDULES|FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH)\b[\s\S]*$/,
        '',
      )
      .trim();
    heading = heading.replace(/\s+[A-Z]\s+-\s+[\s\S]*$/, '').trim();
    entries.push({ number: match[1]!, heading: heading.replace(/\s+/g, ' ') });
  }
  return entries;
}

function linesOf(raw: string): string[] {
  return cleanSource(raw)
    .split('\n')
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((line) => line.length > 0 && !/^\d{1,3}$/.test(line))
    .map((line) => repair(line));
}

function splitTitle(text: string): { heading: string; extra: string } {
  const match = text.match(/^(.*?)\s+(\d+[A-Z]?\.\s+\S[\s\S]*)$/);
  if (
    match?.[1] &&
    match[2] &&
    match[1].trim().length > 0 &&
    match[1].trim().length < 160
  ) {
    return { heading: match[1].trim(), extra: match[2].trim() };
  }
  return { heading: text.trim(), extra: '' };
}

function isTitle(text: string): boolean {
  const stripped = text.replace(/^\d+[A-Z]?\.\s*/, '');
  return (
    stripped.length > 0 &&
    stripped.length < 180 &&
    !stripped.includes('(1)') &&
    !stripped.includes('.')
  );
}

function titleText(text: string): string {
  return text
    .replace(/^\d+[A-Z]?\.\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(raw: string): Item[] {
  const lines = linesOf(raw);
  const start = lines.findIndex((line) =>
    line.startsWith('WE the people of the Federal Republic of Nigeria'),
  );
  if (start < 0) throw new Error('Preamble not found in the source.');
  const items: Item[] = [];
  let inSchedule = false;
  for (const line of lines.slice(start)) {
    if (/^SCHEDULES$/.test(line)) {
      inSchedule = true;
      continue;
    }
    const schedule = line.match(
      /^(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH)\s+SCHEDULE\b\s*(.*)$/,
    );
    if (schedule?.[1]) {
      inSchedule = true;
      items.push({
        kind: 'schedule',
        name: schedule[1][0] + schedule[1].slice(1).toLowerCase(),
        heading: schedule[2]?.trim() ?? '',
      });
      continue;
    }
    const chapter = line.match(/^CHAPTER\s+([IVXLC]+)\b\s*(.*)$/);
    if (chapter?.[1]) {
      const split = splitTitle(chapter[2] ?? '');
      items.push({
        kind: 'chapter',
        number: chapter[1],
        heading: split.heading,
        extra: split.extra,
      });
      continue;
    }
    const part = line.match(/^PART\s+([IVXLC]+)\b\s*(.*)$/);
    if (part?.[1]) {
      const split = splitTitle(part[2] ?? '');
      items.push({
        kind: 'part',
        number: part[1],
        heading: split.heading,
        extra: split.extra,
      });
      continue;
    }
    const dotted = inSchedule ? line.match(/^([A-Z])\.\s+([A-Z].*)$/) : null;
    const group = dotted ?? line.match(/^([A-Z]{1,2})\s*-\s*(\S.*)$/);
    if (group?.[1] && group[2]) {
      const split = splitTitle(group[2]);
      items.push({
        kind: 'group',
        marker: group[1],
        heading: split.heading,
        extra: split.extra,
      });
      continue;
    }
    const section = line.match(/^(\d+[A-Z]?)\.\s*(.*)$/);
    if (section?.[1] && !inSchedule) {
      items.push({
        kind: 'section',
        number: section[1],
        text: `${section[1]}. ${section[2] ?? ''}`.trim(),
      });
      continue;
    }
    items.push({ kind: 'prose', text: line });
  }
  return items;
}

function uniqueAnchor(used: Set<string>, base: string): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let count = 2;
  while (used.has(`${base}-${count}`)) count += 1;
  const next = `${base}-${count}`;
  used.add(next);
  return next;
}

function previousWord(before: string): string {
  return (before.trimEnd().split(/\s+/).pop() ?? '').replace(/[^A-Za-z]/g, '');
}

export function parseBlocks(body: string): Block[] {
  const source = repair(body);
  const expression = /\((\d+|[a-z]{1,2})\)|Provided that/g;
  const top: Block[] = [];
  const used = new Set<string>();
  let subsection: Block | null = null;
  let paragraph: Block | null = null;
  let subparagraph: Block | null = null;
  let proviso: Block | null = null;
  let nextSub = 1;
  let nextPara = 'a';
  let roman = 0;
  let last = 0;

  const append = (chunk: string) => {
    const cleaned = chunk.replace(/\s+/g, ' ');
    if (!cleaned.trim()) return;
    const target = proviso ?? subparagraph ?? paragraph ?? subsection;
    if (!target) {
      const existing = top[top.length - 1];
      if (existing?.type === 'paragraph_text') {
        existing.text = `${existing.text} ${cleaned}`
          .replace(/\s+/g, ' ')
          .trim();
        return;
      }
      top.push({
        type: 'paragraph_text',
        marker: '',
        anchor: uniqueAnchor(used, `text-${top.length + 1}`),
        text: cleaned.trim(),
      });
      return;
    }
    target.text = `${target.text} ${cleaned}`.replace(/\s+/g, ' ').trim();
  };

  const open = (block: Block, parent: Block | null) => {
    if (parent) {
      parent.blocks ??= [];
      parent.blocks.push(block);
    } else top.push(block);
  };

  for (const match of source.matchAll(expression)) {
    const index = match.index ?? 0;
    append(source.slice(last, index));
    const raw = match[0];
    const before = source.slice(0, index);
    const after = source.slice(index + raw.length, index + raw.length + 12);
    const prevChar = before.trimEnd().slice(-1);
    const word = previousWord(before);
    const referenceWord =
      /^(subsections|subsection|sections|section|paragraphs|paragraph|items|item|subparagraphs|subparagraph)$/i.test(
        word,
      );
    const glued = /[A-Za-z0-9]/.test(prevChar);
    const listJoin = /^\s+(?:to|and|or)\b/i.test(after);

    if (raw === 'Provided that') {
      if (!glued && !referenceWord) {
        const parent = subparagraph ?? paragraph ?? subsection;
        proviso = {
          type: 'proviso',
          marker: '',
          anchor: uniqueAnchor(
            used,
            parent ? `${parent.anchor}-proviso` : 'proviso',
          ),
          text: 'Provided that',
        };
        open(proviso, parent);
      } else append(raw);
    } else {
      const marker = match[1] ?? '';
      const structural =
        !referenceWord &&
        !glued &&
        !listJoin &&
        (/^\d+$/.test(marker)
          ? Number(marker) === nextSub
          : (paragraph && ROMANS[roman] === marker) ||
            marker === nextPara ||
            (marker === 'a' && /[-–—:;.(]$/.test(prevChar)) ||
            (marker.length === 2 &&
              !ROMANS.includes(marker) &&
              subsection !== null));
      if (!structural) append(raw);
      else if (/^\d+$/.test(marker)) {
        subsection = {
          type: 'subsection',
          marker,
          anchor: uniqueAnchor(used, `sub-${marker}`),
          text: '',
        };
        paragraph = null;
        subparagraph = null;
        proviso = null;
        nextSub = Number(marker) + 1;
        nextPara = 'a';
        roman = 0;
        open(subsection, null);
      } else if (paragraph && ROMANS[roman] === marker) {
        const parent = paragraph;
        subparagraph = {
          type: 'subparagraph',
          marker,
          anchor: uniqueAnchor(used, `${parent.anchor}-${marker}`),
          text: '',
        };
        proviso = null;
        roman += 1;
        open(subparagraph, parent);
      } else {
        const parent = subsection;
        paragraph = {
          type: 'paragraph',
          marker,
          anchor: uniqueAnchor(
            used,
            parent ? `${parent.anchor}-${marker}` : `para-${marker}`,
          ),
          text: '',
        };
        subparagraph = null;
        proviso = null;
        roman = 0;
        if (marker.length === 1)
          nextPara = String.fromCharCode(marker.charCodeAt(0) + 1);
        else if (marker === 'cc') nextPara = 'd';
        open(paragraph, parent);
      }
    }
    last = index + raw.length;
  }
  append(source.slice(last));
  return prune(top);
}

function prune(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const next = { ...block };
    if (next.blocks) {
      next.blocks = prune(next.blocks);
      if (next.blocks.length === 0) delete next.blocks;
    }
    return next;
  });
}

function splitHeading(
  number: string,
  text: string,
  tocHeading?: string,
): { heading: string; body: string } {
  const rest = text.replace(
    new RegExp(`^${number.replace(/[.]/g, '\\$&')}\\.\\s*`),
    '',
  );
  if (tocHeading) {
    const pattern = tocHeading
      .trim()
      .split(/\s+/)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\s+');
    const match = rest.match(new RegExp(`^${pattern}\\s*`, 'i'));
    if (match?.[0]) {
      return {
        heading: rest.slice(0, match[0].length).replace(/\s+/g, ' ').trim(),
        body: rest.slice(match[0].length).trim(),
      };
    }
  }
  const marker = rest.search(/\(\d+\)/);
  if (marker > 0 && marker < 280) {
    return {
      heading: rest.slice(0, marker).replace(/\s+/g, ' ').trim(),
      body: rest.slice(marker).trim(),
    };
  }
  const sentence = rest.search(
    /\s+(?:There|This|The|A|An|Subject|No|Every|In|For|Where|Notwithstanding|Nothing|Save|Except|If|Whenever|Any|All|Without|It|He|Such|Provided|Unless|On|At)\s/,
  );
  if (sentence > 0 && sentence < 280) {
    return {
      heading: rest.slice(0, sentence).replace(/\s+/g, ' ').trim(),
      body: rest.slice(sentence).trim(),
    };
  }
  return { heading: '', body: rest.trim() };
}

function stateAt(line: string): string | undefined {
  return STATES.find((state) => line === state || line.startsWith(`${state} `));
}

function cleanCell(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\/\s+/g, '/')
    .replace(/-\s+/g, '-')
    .trim();
}

function stateTable(lines: string[]): Block {
  const rows: string[][] = [
    ['State', 'Local Government Areas', 'Capital City'],
  ];
  let current: { state: string; lgas: string[]; capital: string } | null = null;
  const data = lines.filter((line) => !/Local Government Areas/i.test(line));
  for (let index = 0; index < data.length; index += 1) {
    const line = data[index]!;
    const state = stateAt(line);
    const next = data[index + 1];
    const nextState = next ? stateAt(next) : undefined;
    const bareCapital = Boolean(
      state && line === state && nextState && nextState !== state,
    );
    if (state && !bareCapital) {
      if (current)
        rows.push([
          current.state,
          cleanCell(current.lgas.join(' ')),
          current.capital,
        ]);
      current = {
        state,
        lgas: line.slice(state.length).trim()
          ? [line.slice(state.length).trim()]
          : [],
        capital: '',
      };
      continue;
    }
    if (!current) continue;
    const nextIsState = next ? Boolean(stateAt(next)) : true;
    if (!line.includes(',') && nextIsState) current.capital = cleanCell(line);
    else current.lgas.push(line);
  }
  if (current)
    rows.push([
      current.state,
      cleanCell(current.lgas.join(' ')),
      current.capital,
    ]);
  if (rows.length !== 37) {
    throw new Error(
      `First Schedule state table has ${rows.length - 1} rows, expected 36: ${rows
        .slice(1)
        .map((row) => row[0])
        .join(' | ')}`,
    );
  }
  const missing = rows
    .slice(1)
    .filter((row) => !row[2])
    .map((row) => row[0]);
  if (missing.length > 0)
    throw new Error(`Missing capital cities: ${missing.join(', ')}`);
  return { type: 'table', marker: '', anchor: 'table-1', text: '', rows };
}

function areaBlocks(lines: string[]): Block[] {
  const text = lines.join('\n');
  const tableAt = text.search(/Area Councils/i);
  const blocks: Block[] = [];
  const before = (tableAt >= 0 ? text.slice(0, tableAt) : text)
    .replace(/\s+/g, ' ')
    .trim();
  if (before) {
    blocks.push({
      type: 'paragraph_text',
      marker: '',
      anchor: 'text-1',
      text: before,
    });
  }
  if (tableAt < 0) return blocks.length > 0 ? blocks : parseBlocks(text);
  let rest = text
    .slice(tableAt)
    .replace(/\s+/g, ' ')
    .replace(/^.*?Headquarters\s*/i, '');
  const rows = [['Area Council', 'Headquarters']];
  for (let index = 0; index < COUNCILS.length; index += 1) {
    const name = COUNCILS[index]!;
    const start = rest.toLowerCase().indexOf(name.toLowerCase());
    if (start < 0) throw new Error(`Missing area council ${name}`);
    const from = start + name.length;
    const next = COUNCILS[index + 1];
    const end = next
      ? rest.toLowerCase().indexOf(next.toLowerCase(), from)
      : rest.length;
    rows.push([
      name,
      rest
        .slice(from, end < 0 ? rest.length : end)
        .replace(/\s+/g, ' ')
        .trim(),
    ]);
    rest = rest.slice(end < 0 ? rest.length : end);
  }
  blocks.push({ type: 'table', marker: '', anchor: 'table-1', text: '', rows });
  return blocks;
}

function makeSection(
  number: string,
  heading: string,
  blocks: Block[],
): Section {
  const section: Section = {
    id: `cfrn-1999:s:${number}`,
    number,
    blocks:
      blocks.length > 0
        ? blocks
        : [
            {
              type: 'paragraph_text',
              marker: '',
              anchor: 'text-1',
              text: heading,
            },
          ],
    plainText: 'pending',
  };
  if (heading.trim()) section.heading = heading.replace(/\s+/g, ' ').trim();
  return section;
}

type Bucket = { unit: Unit; lines: string[]; key: string };

export type BuiltCorpus = {
  instrument: Instrument;
  outline: {
    instrumentId: string;
    sectionCount: number;
    headings: { kind: string; heading: string }[];
    sectionOrder: string[];
    tocSectionOrder: string[];
  };
};

export function buildConstitution(raw = readConstitutionSource()): BuiltCorpus {
  const toc = extractTocEntries(raw);
  const tocByNumber = new Map(
    toc.map((entry) => [entry.number, entry.heading]),
  );
  const items = tokenize(raw);
  const units: Unit[] = [];
  let chapter: Unit | null = null;
  let part: Unit | null = null;
  let group: Unit | null = null;
  let schedule: Unit | null = null;
  let bucket: Bucket | null = null;
  const readBucket = (): Bucket | null => bucket;
  let scheduleCount = 0;
  let partCount = 0;

  const current = (): Unit => {
    const unit = group ?? part ?? chapter ?? schedule;
    if (!unit) throw new Error('Text appeared before a unit.');
    return unit;
  };

  const flush = () => {
    if (!bucket || bucket.lines.length === 0) return;
    const lines = bucket.lines;
    bucket.lines = [];
    const heading = bucket.unit.heading;
    let blocks: Block[];
    if (heading === 'States of the Federation') blocks = [stateTable(lines)];
    else if (
      /Area Council/i.test(heading) ||
      lines.some((line) => /Area Councils/i.test(line))
    ) {
      blocks = areaBlocks(lines);
    } else blocks = parseBlocks(lines.join(' '));
    if (blocks.length === 0) return;
    const section = makeSection(bucket.key, heading, blocks);
    bucket.unit.sections = [...(bucket.unit.sections ?? []), section];
  };

  const openBucket = (unit: Unit, key: string): Bucket => {
    flush();
    const next: Bucket = { unit, lines: [], key };
    bucket = next;
    return next;
  };

  const takeTitle = (
    itemsAt: Item[],
    index: number,
    heading: string,
  ): { heading: string; index: number; extra: string } => {
    if (heading.trim()) {
      return { heading: heading.replace(/\s+/g, ' ').trim(), index, extra: '' };
    }
    const next = itemsAt[index + 1];
    if (next?.kind === 'prose') {
      const split = splitTitle(next.text);
      if (split.extra && split.heading.length < 160) {
        return { heading: split.heading, index: index + 1, extra: split.extra };
      }
      if (isTitle(next.text))
        return { heading: titleText(next.text), index: index + 1, extra: '' };
    }
    return { heading: '', index, extra: '' };
  };

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    if (item.kind === 'prose' && !chapter && !schedule) {
      const preamble = units[0] ?? {
        id: 'cfrn-1999:u:preamble',
        kind: 'chapter' as const,
        heading: 'Preamble',
        sections: [] as Section[],
      };
      if (!units.includes(preamble)) units.push(preamble);
      const text = [item.text];
      while (items[index + 1]?.kind === 'prose') {
        index += 1;
        text.push((items[index] as { text: string }).text);
      }
      preamble.sections = [
        makeSection('preamble', 'Preamble', parseBlocks(text.join(' '))),
      ];
      continue;
    }
    if (item.kind === 'chapter') {
      flush();
      bucket = null;
      const taken = takeTitle(items, index, item.heading);
      index = taken.index;
      group = null;
      part = null;
      schedule = null;
      chapter = {
        id: `cfrn-1999:u:c${item.number.toLowerCase()}`,
        kind: 'chapter',
        number: item.number,
        heading: taken.heading || `Chapter ${item.number}`,
        units: [],
      };
      units.push(chapter);
      if (item.extra || taken.extra) {
        const opened = openBucket(
          chapter,
          `c${item.number.toLowerCase()}-note`,
        );
        if (item.extra) opened.lines.push(item.extra);
        if (taken.extra) opened.lines.push(taken.extra);
      }
      continue;
    }
    if (item.kind === 'schedule') {
      flush();
      const taken = takeTitle(items, index, item.heading);
      index = taken.index;
      scheduleCount += 1;
      partCount = 0;
      chapter = null;
      part = null;
      group = null;
      schedule = {
        id: `cfrn-1999:u:sch${scheduleCount}`,
        kind: 'schedule',
        number: item.name,
        heading: taken.heading || `${item.name} Schedule`,
        units: [],
      };
      units.push(schedule);
      const openedSchedule = openBucket(schedule, `sch${scheduleCount}`);
      if (taken.extra) openedSchedule.lines.push(taken.extra);
      continue;
    }
    if (item.kind === 'part') {
      flush();
      const taken = takeTitle(items, index, item.heading);
      index = taken.index;
      const parent = chapter ?? schedule;
      if (!parent) throw new Error(`Part ${item.number} has no parent.`);
      partCount += 1;
      group = null;
      const key = schedule
        ? `sch${scheduleCount}-pt${partCount}`
        : `${parent.id.slice(parent.id.lastIndexOf(':') + 1)}-p${item.number.toLowerCase()}`;
      part = {
        id: `${parent.id}-p${item.number.toLowerCase()}`,
        kind: 'part',
        number: item.number,
        heading: taken.heading || `Part ${item.number}`,
        units: [],
      };
      parent.units = [...(parent.units ?? []), part];
      const openedPart = openBucket(part, schedule ? key : part.id);
      if (item.extra) openedPart.lines.push(item.extra);
      if (taken.extra) openedPart.lines.push(taken.extra);
      continue;
    }
    if (item.kind === 'group') {
      flush();
      const parent = part ?? chapter ?? schedule;
      if (!parent) throw new Error(`Group ${item.marker} has no parent.`);
      group = {
        id: `${parent.id}-${item.marker.toLowerCase()}`,
        kind: 'part',
        number: item.marker,
        heading: item.heading.replace(/\s+/g, ' ').trim(),
        units: [],
      };
      parent.units = [...(parent.units ?? []), group];
      const keyBase = readBucket()?.key ?? parent.id;
      const openedGroup = openBucket(
        group,
        `${keyBase}-${item.marker.toLowerCase()}`,
      );
      if (item.extra) openedGroup.lines.push(item.extra);
      continue;
    }
    if (item.kind === 'section') {
      flush();
      let text = item.text;
      while (items[index + 1]?.kind === 'prose') {
        index += 1;
        text += ` ${(items[index] as { text: string }).text}`;
      }
      const split = splitHeading(
        item.number,
        repair(text),
        tocByNumber.get(item.number),
      );
      const body = split.body || split.heading;
      const heading = split.body ? split.heading : '';
      const blocks = parseBlocks(body);
      const section = makeSection(item.number, heading, blocks);
      if (
        /fair hearing/i.test(
          `${heading} ${section.blocks.map((block) => block.text).join(' ')}`,
        )
      ) {
        section.aliases = ['fair hearing'];
      }
      const unit = current();
      unit.sections = [...(unit.sections ?? []), section];
      continue;
    }
    const loose = readBucket() ?? openBucket(current(), 'loose');
    loose.lines.push(item.text);
  }
  flush();

  const instrument = stamp(units);
  const headings = outlineUnits(instrument.units);
  if (JSON.stringify(headings) !== JSON.stringify(outlineHeadings)) {
    throw new Error(
      `Outline headings differ.\nParsed: ${JSON.stringify(headings, null, 2)}`,
    );
  }
  const sections = collectInstrumentSections(instrument);
  const bodyNumbers = sections
    .map((section) => section.number)
    .filter((number) => /^\d+[A-Z]?$/.test(number));
  const seen = new Set<string>();
  const tocNumbers = toc
    .map((entry) => entry.number)
    .filter((number) => {
      if (seen.has(number)) return false;
      seen.add(number);
      return true;
    });
  if (bodyNumbers.join('\n') !== tocNumbers.join('\n')) {
    const mismatch = bodyNumbers.findIndex(
      (number, index) => number !== tocNumbers[index],
    );
    throw new Error(
      `Section order differs from the arrangement at ${mismatch}: body ${bodyNumbers[mismatch] ?? 'end'} / arrangement ${tocNumbers[mismatch] ?? 'end'}. Body ${bodyNumbers.length}, arrangement ${tocNumbers.length}.`,
    );
  }
  return {
    instrument,
    outline: {
      instrumentId: 'cfrn-1999',
      sectionCount: sections.length,
      headings,
      sectionOrder: sections.map((section) => section.number),
      tocSectionOrder: tocNumbers,
    },
  };
}

function isLetteredDivision(unit: Unit): boolean {
  if (unit.kind !== 'part' || !unit.number || !/^[A-Z]{1,2}$/.test(unit.number))
    return false;
  return !unit.id.endsWith(`-p${unit.number.toLowerCase()}`);
}

function outlineUnits(
  units: readonly Unit[],
): { kind: 'chapter' | 'part' | 'schedule'; heading: string }[] {
  const headings: { kind: 'chapter' | 'part' | 'schedule'; heading: string }[] =
    [];
  for (const unit of units) {
    if (!isLetteredDivision(unit))
      headings.push({ kind: unit.kind, heading: unit.heading });
    if (unit.units) headings.push(...outlineUnits(unit.units));
  }
  return headings;
}

function stamp(units: Unit[]): Instrument {
  const draft: Instrument = {
    content_schema_version: 1,
    id: 'cfrn-1999',
    kind: 'constitution',
    title: 'Constitution of the Federal Republic of Nigeria 1999',
    shortTitle: 'Constitution',
    citation: 'Constitution of the Federal Republic of Nigeria 1999',
    year: 1999,
    commencement: '29th day of May 1999',
    extent: 'The Federal Republic of Nigeria.',
    versionLabel:
      '1999, consolidated to the First, Second and Third Alterations (2010), the Fourth Alteration (2017) and the Fifth Alteration (2023)',
    contentVersion: 'pending',
    legalTextHash: 'a'.repeat(64),
    indexHash: 'b'.repeat(64),
    alterations: provenanceJson.alterations,
    structureNote:
      'The preamble is the opening unit. Schedules follow section 320. Each schedule part, and each lettered division the source prints inside a schedule, is its own section. Numbered items inside those sections stay in the section. The First Schedule, Part I, is one table. Square-bracket compiler notes from the PLAC print are not part of the text.',
    source: {
      name: provenanceJson.name,
      url: provenanceJson.url,
      retrievedOn: provenanceJson.retrievedOn,
      reuseNote: provenanceJson.reuseNote,
    },
    review: {
      status: 'reviewed',
      reviewedOn: '2026-10-25',
      reviewer: provenanceJson.checker,
    },
    units,
  };
  for (const section of collectInstrumentSections(draft)) {
    section.plainText = derivePlainText(section.blocks);
  }
  const known = new Set(
    collectInstrumentSections(draft).map((section) => section.number),
  );
  for (const section of collectInstrumentSections(draft)) {
    const mentions = extractSectionMentions(section.plainText).filter(
      (number) => known.has(number),
    );
    if (mentions.length > 0) {
      section.crossReferences = mentions.map(
        (number) => `cfrn-1999:s:${number}`,
      );
    }
  }
  const sections = collectInstrumentSections(draft);
  draft.legalTextHash = legalTextHash(sections);
  draft.indexHash = indexHash(sections);
  draft.contentVersion = makeContentVersion('2026-10-25', draft.legalTextHash);
  return draft;
}

export function corpusSourcePath(): string {
  return sourcePath;
}
