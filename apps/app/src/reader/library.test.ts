import { describe, expect, it } from 'vitest';
import { catalogueRows, continueSectionLabel } from './library';

describe('library catalogue', () => {
  it('omits the Acts list while no shipping Act is registered', () => {
    const catalogue = catalogueRows({
      instruments: [
        {
          id: 'cfrn-1999',
          kind: 'constitution',
          shortTitle: 'Constitution',
          versionLabel: '1999',
        },
      ],
      registry: [{ id: 'cfrn-1999', shipping: true }],
    });
    expect(catalogue.constitutions.map((item) => item.shortTitle)).toEqual([
      'Constitution',
    ]);
    expect(catalogue.acts).toEqual([]);
  });

  it('hides Continue when there is no reading position', () => {
    const position = null;
    const label = position
      ? continueSectionLabel(
          { number: '36', heading: 'Right to fair hearing' },
          'cfrn-1999:s:36',
        )
      : null;
    expect(label).toBeNull();
    expect(
      continueSectionLabel(
        { number: '36', heading: 'Right to fair hearing' },
        'cfrn-1999:s:36',
      ),
    ).toBe('36. Right to fair hearing');
  });
});
