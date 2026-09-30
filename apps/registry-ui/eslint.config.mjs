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
];
