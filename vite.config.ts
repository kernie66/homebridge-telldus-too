import { configDefaults, defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    singleQuote: true,
    printWidth: 120,
    jsPlugins: ['eslint-plugin-unused-imports'],
    sortImports: {
      groups: [
        'type-import',
        ['value-builtin', 'value-external'],
        'type-internal',
        'value-internal',
        ['type-parent', 'type-sibling', 'type-index'],
        ['value-parent', 'value-sibling', 'value-index'],
        'unknown',
      ],
    },
  },
  lint: {
    ignorePatterns: ['dist/**'],
    options: { typeAware: true, typeCheck: true },
  },
  staged: {
    '*': 'vp check --fix',
  },
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
