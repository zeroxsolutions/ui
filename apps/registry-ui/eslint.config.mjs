import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...nx.configs['flat/react-typescript'],
  ...baseConfig,
  {
    ignores: [
      '.next/**/*',
      '.source/**/*',
      'registry/bases/base-ui/examples/__index__.tsx',
      'registry/bases/base-ui/examples/__components__.tsx',
      '**/out-tsc',
    ],
  },
  {
    // What the registry ships lands in each consuming app's own tree and is linted by that app's
    // rules, which hold the house's `explicit-function-return-type` and the preset's
    // `no-empty-function`. The repo turns the second off and never takes the first, so an item
    // green here failed lint the moment an org app installed it.
    files: ['registry/bases/base-ui/{blocks,components,hooks,lib,types}/**/*.{ts,tsx}'],
    // `use-mobile.ts` is upstream's, the `sidebar` item's own hook, and stays as the CLI wrote it.
    ignores: ['**/*.spec.{ts,tsx}', 'registry/bases/base-ui/hooks/use-mobile.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-empty-function': 'error',
    },
  },
];
