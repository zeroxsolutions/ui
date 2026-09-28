import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/worker-configuration.d.ts',
      '**/cloudflare-env.d.ts',
      '**/test-output',
      '**/.next',
      '**/.open-next',
      '**/.wrangler',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    // Override or add rules here. `no-empty-function` is off because no-op
    // default callbacks (`() => {}`) are idiomatic across this component library;
    // `no-non-null-assertion` is off because `!` is used deliberately at
    // known-safe sites (refs, post-guard access).
    rules: {
      // Only the invisible half of the plain-ASCII rule is mechanical: a zero-width space or a BOM is
      // not something a reviewer fails to catch, it is something no reviewer can catch, and it corrupts
      // grep and diffs downstream. The visible glyphs get no check at all - a person reaching for a key
      // does not type an em dash, so a hook would tax every human commit for what only an agent emits.
      'no-irregular-whitespace': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
