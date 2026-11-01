import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  assetsInclude: ['**/*.ttf', '**/*.png', '**/*.svg'],
  define: {
    __DEV__: true,
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
