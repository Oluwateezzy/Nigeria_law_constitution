import { describe, expect, it } from 'vitest';
import { derivePlainText } from '@nigeria-law/domain';
import { exampleInstrument } from './fixture';
import { instrumentSchema } from './schema';

const plain =
  '(1) Example words of a subsection. (a) Example words of a paragraph. Provided that the example stops here. Column A | Column B One | Two A pointer to section 36.';

describe('instrument schema', () => {
  it('parses the fake fixture and keeps a stable plain text', () => {
    const instrument = instrumentSchema.parse(exampleInstrument());
    const section = instrument.units[0]?.sections?.[0];
    expect(section?.plainText).toBe(plain);
    expect(section?.plainText).toBe(derivePlainText(section?.blocks ?? []));
    for (const item of instrument.units[0]?.sections ?? []) {
      expect(item.id).toBe(`${instrument.id}:s:${item.number}`);
    }
    expect(section?.crossReferences).toEqual(['example:s:36']);
  });

  it('produces no cross-reference when the target section does not exist', () => {
    const instrument = exampleInstrument({ includeTarget: false });
    expect(instrument.units[0]?.sections?.[0]?.crossReferences).toEqual([]);
  });

  it('rejects a missing source url', () => {
    const instrument = exampleInstrument();
    instrument.source = { ...instrument.source, url: '' };
    expect(instrumentSchema.safeParse(instrument).success).toBe(false);
  });

  it('rejects a duplicate section id', () => {
    const instrument = exampleInstrument();
    const section = instrument.units[0]?.sections?.[0];
    instrument.units[0]?.sections?.push(section!);
    const parsed = instrumentSchema.safeParse(instrument);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((issue) =>
          issue.message.includes('duplicate section id'),
        ),
      ).toBe(true);
    }
  });

  it('rejects an unknown block type', () => {
    const instrument = exampleInstrument();
    const block = instrument.units[0]?.sections?.[0]?.blocks[0];
    if (block) block.type = 'commentary' as 'subsection';
    expect(instrumentSchema.safeParse(instrument).success).toBe(false);
  });
});
