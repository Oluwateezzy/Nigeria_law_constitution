import type { Note } from './repository';

export type NoteSection = {
  id: string;
  number: string;
  heading: string;
  instrumentId: string;
  instrumentTitle: string;
};

export type NoteListItem = {
  id: string;
  title: string;
  bodyPreview?: string;
  sectionId: string | null;
  sectionNumber: string | null;
  instrumentId: string | null;
  updatedAt: string;
};

export type NoteListGroup = {
  id: string;
  title: string;
  items: NoteListItem[];
};

export const unattachedGroupId = 'unattached';
export const unattachedGroupTitle = 'On their own';

export function noteRowTitle(
  title: string | null | undefined,
  body: string,
  sectionNumber?: string | null,
): string;
export function noteRowTitle(
  body: string,
  sectionNumber: string | null,
): string;
export function noteRowTitle(
  firstArg: string | null | undefined,
  secondArg?: string | null,
  thirdArg?: string | null,
): string {
  if (arguments.length >= 3) {
    const title = firstArg?.trim();
    if (title && title.length > 0) return title;
    const body = secondArg ?? '';
    const first = (body.split('\n')[0] ?? '').trim();
    if (first.length > 0) return first;
    if (thirdArg) return `Note on section ${thirdArg}`;
    return 'Note';
  }
  if (firstArg?.includes('\n') || (secondArg && /^\d+/.test(secondArg))) {
    const first = ((firstArg ?? '').split('\n')[0] ?? '').trim();
    if (first.length > 0) return first;
    if (secondArg) return `Note on section ${secondArg}`;
    return 'Note';
  }
  const title = firstArg?.trim();
  if (title && title.length > 0) return title;
  const bodyFirst = ((secondArg ?? '').split('\n')[0] ?? '').trim();
  if (bodyFirst.length > 0) return bodyFirst;
  return 'Note';
}

function sectionRank(number: string): [number, string] {
  const match = /^(\d+)/.exec(number);
  return [match ? Number(match[1]) : Number.MAX_SAFE_INTEGER, number];
}

export function groupLivingNotes(
  notes: readonly Note[],
  sections: readonly NoteSection[],
): NoteListGroup[] {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const groups = new Map<string, NoteListGroup>();
  const unattached: NoteListItem[] = [];
  for (const note of notes) {
    if (note.deletedAt) continue;
    const section = note.sectionId ? byId.get(note.sectionId) : undefined;
    const itemTitle = noteRowTitle(note.title, note.body, section?.number ?? null);
    const bodyTrimmed = note.body.replace(/\n+/g, ' ').trim();
    const item: NoteListItem = {
      id: note.id,
      title: itemTitle,
      bodyPreview:
        note.title && bodyTrimmed.length > 0 && bodyTrimmed !== itemTitle
          ? bodyTrimmed
          : undefined,
      sectionId: note.sectionId,
      sectionNumber: section?.number ?? null,
      instrumentId: note.instrumentId,
      updatedAt: note.updatedAt,
    };
    if (!note.sectionId) {
      unattached.push(item);
      continue;
    }
    const groupId = note.instrumentId ?? 'instrument';
    const group = groups.get(groupId) ?? {
      id: groupId,
      title: section?.instrumentTitle ?? groupId,
      items: [],
    };
    group.items.push(item);
    groups.set(groupId, group);
  }
  const ordered = [...groups.values()].sort((left, right) =>
    left.title.localeCompare(right.title),
  );
  for (const group of ordered) {
    group.items.sort((left, right) => {
      const cmp = left.title.localeCompare(right.title, undefined, {
        sensitivity: 'base',
      });
      if (cmp !== 0) return cmp;
      if (left.updatedAt !== right.updatedAt) {
        return left.updatedAt < right.updatedAt ? 1 : -1;
      }
      return left.id.localeCompare(right.id);
    });
  }
  if (unattached.length > 0) {
    ordered.push({
      id: unattachedGroupId,
      title: unattachedGroupTitle,
      items: unattached,
    });
  }
  return ordered;
}

export function notesMarkdown(
  notes: readonly Note[],
  sections: readonly NoteSection[],
): string {
  const groups = groupLivingNotes(notes, sections);
  const byId = new Map(notes.map((note) => [note.id, note]));
  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const parts: string[] = [];
  for (const group of groups) {
    parts.push(`# ${group.title}`);
    for (const item of group.items) {
      const note = byId.get(item.id);
      if (!note || note.deletedAt) continue;
      const section = item.sectionId
        ? sectionById.get(item.sectionId)
        : undefined;
      const label = section
        ? section.heading
          ? `${section.number}. ${section.heading}`
          : section.number
        : item.title;
      parts.push(`## ${label}`, note.body.trim());
    }
  }
  return `${parts.join('\n\n')}\n`;
}
