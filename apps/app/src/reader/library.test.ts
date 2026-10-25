import { describe, expect, it } from 'vitest';
import { actRowDetail, catalogueRows, continueSectionLabel } from './library';

describe('library catalogue', () => {
  it('omits the Acts list while no shipping Act is registered', () => {
    const catalogue = catalogueRows({
      instruments: [
        {
          id: 'cfrn-1999',
          kind: 'constitution',
          shortTitle: 'Constitution',
          versionLabel: '1999',
          year: 1999,
          extent: 'The Federal Republic of Nigeria.',
          reviewStatus: 'reviewed',
        },
      ],
      registry: [{ id: 'cfrn-1999', shipping: true }],
    });
    expect(catalogue.constitutions.map((item) => item.shortTitle)).toEqual([
      'Constitution',
    ]);
    expect(catalogue.acts).toEqual([]);
  });

  it('labels a draft Act on the library row when a test build bundles it', () => {
    const catalogue = catalogueRows({
      instruments: [
        {
          id: 'example',
          kind: 'act',
          shortTitle: 'Example',
          versionLabel: 'Fake fixture',
          year: 2026,
          extent: 'Nowhere. This fixture is not law.',
          reviewStatus: 'draft',
        },
      ],
      registry: [{ id: 'example', shipping: true }],
    });
    expect(catalogue.acts).toHaveLength(1);
    const detail = actRowDetail(catalogue.acts[0]!);
    expect(detail).toContain('2026');
    expect(detail).toContain('Nowhere. This fixture is not law.');
    expect(detail).toContain('Not yet reviewed');
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
