import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    exclude: [
      ...configDefaults.exclude,
      'dist/*',
    ],
    setupFiles: './test/vitest.setup.ts',
  },
});
