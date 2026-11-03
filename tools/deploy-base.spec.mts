import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deployBase } from './deploy-base.mts';

test('skips a failed newest run', () => {
  assert.equal(
    deployBase([
      { head_sha: 'b', conclusion: 'failure' },
      { head_sha: 'a', conclusion: 'success' },
    ]),
    'a',
  );
});

test('returns nothing without a success', () => {
  assert.equal(
    deployBase([
      { head_sha: 'b', conclusion: 'failure' },
      { head_sha: 'a', conclusion: 'cancelled' },
    ]),
    undefined,
  );
});

test('ignores runs still running', () => {
  assert.equal(
    deployBase([
      { head_sha: 'b', conclusion: null },
      { head_sha: 'a', conclusion: 'success' },
    ]),
    'a',
  );
});
