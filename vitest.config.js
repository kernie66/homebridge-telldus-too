import { configDefaults, defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, 'dist/*'],
    setupFiles: './test/vitest.setup.ts',
    coverage: {
      include: ['src/**/*.{ts,js}'],
      exclude: ['**/__tests__/**'],
    },
  },
});
