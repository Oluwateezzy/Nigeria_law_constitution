import { describe, expect, it } from 'vitest';
import { contentSchemaVersion } from './index';

describe('content package', () => {
  it('exports the schema version', () => {
    expect(contentSchemaVersion).toBe(1);
  });
});
