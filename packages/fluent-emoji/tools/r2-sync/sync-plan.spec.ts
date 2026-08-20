import { describe, expect, it } from 'vitest';

import { contentTypeFor, planSync } from './sync-plan';

describe('planSync', () => {
  it('skips an asset whose digest already matches the remote etag', () => {
    const plan = planSync(
      [{ key: '3d/1f92f.webp', path: 'assets/3d/1f92f.webp', md5: 'd41d8c' }],
      new Map([['3d/1f92f.webp', 'd41d8c']]),
    );

    expect(plan.skip).toEqual(['3d/1f92f.webp']);
    expect(plan.upload).toEqual([]);
  });

  it('uploads an asset whose digest differs from the remote etag', () => {
    const changed = {
      key: 'flat/1f389.svg',
      path: 'assets/flat/1f389.svg',
      md5: 'a1b2c3',
    };

    const plan = planSync([changed], new Map([['flat/1f389.svg', '9f8e7d']]));

    expect(plan.upload).toEqual([changed]);
    expect(plan.skip).toEqual([]);
  });

  // The first sync runs against an empty bucket, so this is the case that moves all
  // 9217 files. It passed the moment it was written and no mutation tried so far fails
  // it alone - it is here to document the primary scenario, not to guard a branch.
  it('uploads an asset the bucket does not have yet', () => {
    const added = {
      key: 'anim/1f680.webp',
      path: 'assets/anim/1f680.webp',
      md5: 'c3d4e5',
    };

    const plan = planSync([added], new Map());

    expect(plan.upload).toEqual([added]);
    expect(plan.skip).toEqual([]);
  });

  it('reports a remote key with no local file as an orphan', () => {
    const plan = planSync(
      [{ key: 'mono/1f600.svg', path: 'assets/mono/1f600.svg', md5: 'aaa111' }],
      new Map([
        ['mono/1f600.svg', 'aaa111'],
        ['mono/1f9ff.svg', 'bbb222'],
      ]),
    );

    expect(plan.orphan).toEqual(['mono/1f9ff.svg']);
  });
});

describe('contentTypeFor', () => {
  it('serves webp artwork as image/webp', () => {
    expect(contentTypeFor('3d/1f92f.webp')).toBe('image/webp');
  });

  it('serves svg artwork as image/svg+xml', () => {
    expect(contentTypeFor('flat/1f389.svg')).toBe('image/svg+xml');
  });

  it('refuses a key whose extension it does not know', () => {
    expect(() => contentTypeFor('3d/1f92f.avif')).toThrow(/avif/);
  });
});
