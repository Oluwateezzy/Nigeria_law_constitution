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
  body: string,
  sectionNumber: string | null,
): string {
  const first = (body.split('\n')[0] ?? '').trim();
  if (first.length > 0) return first;
  if (sectionNumber) return `Note on section ${sectionNumber}`;
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
    const item: NoteListItem = {
      id: note.id,
      title: noteRowTitle(note.body, section?.number ?? null),
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
      const leftRank = sectionRank(left.sectionNumber ?? '');
      const rightRank = sectionRank(right.sectionNumber ?? '');
      if (leftRank[0] !== rightRank[0]) return leftRank[0] - rightRank[0];
      if (leftRank[1] !== rightRank[1]) {
        return leftRank[1].localeCompare(rightRank[1]);
      }
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
