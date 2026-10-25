import type { Note } from '@/notes/repository';

export type RemoteThread = {
  id: string;
  kind: string;
  sectionId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type RemoteMessage = {
  id: string;
  threadId: string;
  role: string;
  content: string;
  citations: string | null;
  createdAt: string;
};

export type RemotePosition = {
  sectionId: string;
  anchor: string | null;
  updatedAt: string;
};

export type SyncGateway = {
  upsertNotes(notes: readonly Note[]): Promise<void>;
  listNotes(): Promise<Note[]>;
  upsertThreads(threads: readonly RemoteThread[]): Promise<void>;
  listThreads(): Promise<RemoteThread[]>;
  upsertMessages(messages: readonly RemoteMessage[]): Promise<void>;
  listMessages(): Promise<RemoteMessage[]>;
  upsertPosition(position: RemotePosition): Promise<void>;
  listPosition(): Promise<RemotePosition | null>;
  deleteAccount(): Promise<void>;
};
