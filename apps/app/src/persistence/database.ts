export type TextSizeStep = 0 | 1 | 2;

export type ReadingPosition = {
  sectionId: string;
  anchor: string | null;
};

const positionKey = 'reading-position';
const textSizeKey = 'text-size';

export class MemoryDatabase {
  private rows = new Map<string, string>();
  private pending: Promise<void> = Promise.resolve();

  static load(
    snapshot: Record<string, string>,
    persist?: (snapshot: Record<string, string>) => Promise<void>,
  ): MemoryDatabase {
    const database = new MemoryDatabase();
    for (const [key, value] of Object.entries(snapshot)) {
      database.rows.set(key, value);
    }
    database.persist = persist ?? null;
    return database;
  }

  private persist:
    ((snapshot: Record<string, string>) => Promise<void>) | null = null;

  get(key: string): string | null {
    return this.rows.get(key) ?? null;
  }

  set(key: string, value: string) {
    this.rows.set(key, value);
    const persist = this.persist;
    if (!persist) {
      return;
    }
    this.pending = this.pending.then(() => persist(this.snapshot()));
  }

  snapshot(): Record<string, string> {
    return Object.fromEntries(this.rows);
  }

  flush(): Promise<void> {
    return this.pending;
  }
}

export function writeReadingPosition(
  database: MemoryDatabase,
  position: ReadingPosition,
): void {
  database.set(positionKey, JSON.stringify(position));
}

export function readReadingPosition(
  database: MemoryDatabase,
): ReadingPosition | null {
  const raw = database.get(positionKey);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ReadingPosition>;
    if (typeof parsed.sectionId !== 'string' || parsed.sectionId.length === 0) {
      return null;
    }
    return {
      sectionId: parsed.sectionId,
      anchor:
        typeof parsed.anchor === 'string' && parsed.anchor.length > 0
          ? parsed.anchor
          : null,
    };
  } catch {
    return null;
  }
}

export function writeTextSize(
  database: MemoryDatabase,
  step: TextSizeStep,
): void {
  database.set(textSizeKey, String(step));
}

export function readTextSize(database: MemoryDatabase): TextSizeStep {
  const raw = database.get(textSizeKey);
  if (raw === '0' || raw === '1' || raw === '2') {
    return Number(raw) as TextSizeStep;
  }
  return 1;
}
