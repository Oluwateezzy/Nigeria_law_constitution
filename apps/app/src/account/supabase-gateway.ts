import type { SupabaseClient } from '@supabase/supabase-js';
import type { Note } from '@/notes/repository';
import type {
  RemoteMessage,
  RemotePosition,
  RemoteThread,
  SyncGateway,
} from '@/sync/gateway';

type NoteRow = {
  id: string;
  section_id: string | null;
  instrument_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function citationsText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function noteFromRow(row: NoteRow): Note {
  return {
    id: row.id,
    sectionId: row.section_id,
    instrumentId: row.instrument_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncState: 'synced',
  };
}

export function supabaseGateway(
  client: SupabaseClient,
  userId: string,
): SyncGateway {
  return {
    async upsertNotes(notes) {
      if (notes.length === 0) return;
      const { error } = await client.from('notes').upsert(
        notes.map((note) => ({
          id: note.id,
          user_id: userId,
          section_id: note.sectionId,
          instrument_id: note.instrumentId,
          body: note.body,
          created_at: note.createdAt,
          updated_at: note.updatedAt,
          deleted_at: note.deletedAt,
        })),
      );
      if (error) throw new Error(error.message);
    },
    async listNotes() {
      const { data, error } = await client
        .from('notes')
        .select(
          'id, section_id, instrument_id, body, created_at, updated_at, deleted_at',
        );
      if (error) throw new Error(error.message);
      return ((data ?? []) as NoteRow[]).map(noteFromRow);
    },
    async upsertThreads(threads: readonly RemoteThread[]) {
      if (threads.length === 0) return;
      const { error } = await client.from('threads').upsert(
        threads.map((thread) => ({
          id: thread.id,
          user_id: userId,
          kind: thread.kind,
          section_id: thread.sectionId,
          title: thread.title,
          created_at: thread.createdAt,
          updated_at: thread.updatedAt,
          deleted_at: thread.deletedAt,
        })),
      );
      if (error) throw new Error(error.message);
    },
    async listThreads() {
      const { data, error } = await client
        .from('threads')
        .select(
          'id, kind, section_id, title, created_at, updated_at, deleted_at',
        );
      if (error) throw new Error(error.message);
      return (
        (data ?? []) as {
          id: string;
          kind: string;
          section_id: string | null;
          title: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }[]
      ).map((row) => ({
        id: row.id,
        kind: row.kind,
        sectionId: row.section_id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
      }));
    },
    async upsertMessages(messages: readonly RemoteMessage[]) {
      if (messages.length === 0) return;
      const { error } = await client.from('messages').upsert(
        messages.map((message) => ({
          id: message.id,
          thread_id: message.threadId,
          user_id: userId,
          role: message.role,
          content: message.content,
          citations: message.citations,
          created_at: message.createdAt,
        })),
      );
      if (error) throw new Error(error.message);
    },
    async listMessages() {
      const { data, error } = await client
        .from('messages')
        .select('id, thread_id, role, content, citations, created_at');
      if (error) throw new Error(error.message);
      return (
        (data ?? []) as {
          id: string;
          thread_id: string;
          role: string;
          content: string;
          citations: unknown;
          created_at: string;
        }[]
      ).map((row) => ({
        id: row.id,
        threadId: row.thread_id,
        role: row.role,
        content: row.content,
        citations: citationsText(row.citations),
        createdAt: row.created_at,
      }));
    },
    async upsertPosition(position: RemotePosition) {
      const { error } = await client.from('reading_positions').upsert({
        user_id: userId,
        section_id: position.sectionId,
        anchor: position.anchor,
        updated_at: position.updatedAt,
      });
      if (error) throw new Error(error.message);
    },
    async listPosition() {
      const { data, error } = await client
        .from('reading_positions')
        .select('section_id, anchor, updated_at')
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const row = data as {
        section_id: string;
        anchor: string | null;
        updated_at: string;
      };
      return {
        sectionId: row.section_id,
        anchor: row.anchor,
        updatedAt: row.updated_at,
      };
    },
    async deleteAccount() {
      const { error } = await client.rpc('delete_own_account');
      if (error) throw new Error(error.message);
    },
  };
}
