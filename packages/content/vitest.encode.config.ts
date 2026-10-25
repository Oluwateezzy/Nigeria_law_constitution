import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/encode/encode.run.ts'],
  },
});
