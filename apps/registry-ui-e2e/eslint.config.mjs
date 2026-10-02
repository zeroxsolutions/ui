import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../eslint.config.mjs';

export default [
  playwright.configs['flat/recommended'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    // Override or add rules here
    rules: {
      // motion.spec.ts drives every docs motion to its end state from one shared function,
      // called from two tests; each call carries the suite's assertions.
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['drivesEveryDocsMotionToItsEndState'] }],
    },
  },
];
