import nkzw from '@nkzw/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [nkzw],
  rules: {
    'perfectionist/sort-objects': 'off', // Disable sorting of object properties to maintain logical grouping and readability
    'perfectionist/sort-object-types': 'off', // Disable sorting of object properties to maintain logical grouping and readability
    'perfectionist/sort-interfaces': 'off', // Disable sorting of interface members to maintain logical grouping and readability
    'unicorn/numeric-separators-style': [
      'error',
      {
        onlyIfContainsSeparator: true,
        minimumDigits: 6,
        hexadecimal: { groupLength: 4 },
      },
    ],
  },
  options: {
    reportUnusedDisableDirectives: 'warn',
  },
});
