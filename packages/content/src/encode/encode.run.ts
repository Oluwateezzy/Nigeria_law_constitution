import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it } from 'vitest';
import { instrumentSchema } from '../schema';
import { buildConstitution } from './build';

it('writes the constitution corpus', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const built = buildConstitution();
  const instrument = instrumentSchema.parse(built.instrument);
  mkdirSync(join(root, 'corpus'), { recursive: true });
  writeFileSync(
    join(root, 'corpus/cfrn-1999.js'),
    `export default ${JSON.stringify(instrument)};\n`,
  );
  writeFileSync(
    join(root, 'sources/cfrn-1999-outline.json'),
    `${JSON.stringify(built.outline, null, 2)}\n`,
  );
  console.log(
    `${instrument.id} ${built.outline.sectionCount} sections ${instrument.contentVersion}`,
  );
});
