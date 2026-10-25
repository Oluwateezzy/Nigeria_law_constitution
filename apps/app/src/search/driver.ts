export type SqlValue = string | number | null;

export type SqlDatabase = {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  get(
    sql: string,
    params?: SqlValue[],
  ): Promise<Record<string, unknown> | undefined>;
  all(sql: string, params?: SqlValue[]): Promise<Record<string, unknown>[]>;
  transaction(task: () => Promise<void>): Promise<void>;
};
