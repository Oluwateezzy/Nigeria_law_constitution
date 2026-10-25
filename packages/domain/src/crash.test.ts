import { describe, expect, it } from 'vitest';
import { sanitiseCrash } from './crash';

describe('crash sanitiser', () => {
  it('strips a fake key and a note body', () => {
    const clean = sanitiseCrash({
      message: 'crash Bearer sk-fakekey123',
      authorization: 'Bearer secret-token',
      apiKey: 'sk-anotherkey',
      noteBody: 'the private note about the arrest',
      prompt: 'Explain this cell',
      breadcrumbs: [{ question: 'what happened at the station' }],
    });
    const encoded = JSON.stringify(clean);
    expect(encoded).not.toContain('sk-fakekey123');
    expect(encoded).not.toContain('secret-token');
    expect(encoded).not.toContain('sk-anotherkey');
    expect(encoded).not.toContain('private note');
    expect(encoded).not.toContain('Explain this cell');
    expect(encoded).not.toContain('what happened at the station');
    expect(encoded).toContain('[redacted]');
    expect(clean).toMatchObject({ message: 'crash [redacted]' });
  });
});
