import { describe, expect, it } from 'vitest';

import { contentTypeFor, keyForPath, planSync } from './sync-plan';

describe('planSync', () => {
  it('skips an asset whose digest already matches the remote etag', () => {
    const plan = planSync(
      [{ key: '3d/1f92f.webp', path: 'assets/3d/1f92f.webp', md5: 'd41d8c' }],
      new Map([['3d/1f92f.webp', 'd41d8c']]),
    );

    expect(plan.skip).toEqual(['3d/1f92f.webp']);
    expect(plan.upload).toEqual([]);
  });

  it('matches an etag the way S3 returns it, wrapped in double quotes', () => {
    const plan = planSync(
      [{ key: '3d/1f92f.webp', path: 'assets/3d/1f92f.webp', md5: 'd41d8c' }],
      new Map([['3d/1f92f.webp', '"d41d8c"']]),
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
  // 9217 files. It is also the only test here that goes red if an absent remote entry
  // is read as "unknown, skip to be safe".
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

  // An empty walk is indistinguishable from an emptied `assets/`, so the whole bucket
  // comes back as orphans. `main.ts` must refuse `--prune` on an empty local list -
  // see the design spec.
  it('reports every remote key as an orphan when there are no local files', () => {
    const plan = planSync(
      [],
      new Map([
        ['3d/1f92f.webp', 'aaa111'],
        ['flat/1f389.svg', 'bbb222'],
      ]),
    );

    expect(plan.orphan).toEqual(['3d/1f92f.webp', 'flat/1f389.svg']);
    expect(plan.upload).toEqual([]);
    expect(plan.skip).toEqual([]);
  });
});

describe('keyForPath', () => {
  it('keys a file by its path below the assets directory', () => {
    expect(keyForPath('/repo/packages/fluent-emoji/assets', '/repo/packages/fluent-emoji/assets/3d/1f92f.webp')).toBe(
      '3d/1f92f.webp',
    );
  });

  it('keys the same file the same way when the assets directory carries a trailing slash', () => {
    expect(keyForPath('/repo/assets/', '/repo/assets/flat/1f389.svg')).toBe('flat/1f389.svg');
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

  it('refuses a key whose extension names an inherited object property', () => {
    expect(() => contentTypeFor('3d/1f92f.constructor')).toThrow(/constructor/);
  });
});
