// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  platformCounterpart,
  platformLocation,
  platformHome,
  platformNavItems,
  type PlatformPages,
} from './platform-nav';

const PAGES: PlatformPages = {
  web: { docs: ['', 'installation', 'blocks/ai-provider-picker'], components: ['tab-bar', 'copy-button'] },
  native: { docs: ['', 'installation'], components: ['tab-bar', 'button'] },
};

describe('platformLocation', () => {
  it.each([
    ['/', { platform: 'web', section: 'home' }],
    ['/native', { platform: 'native', section: 'home' }],
    ['/view/ai-provider-picker', { platform: 'web', section: 'other' }],
    ['/docs', { platform: 'web', section: 'docs', slug: '' }],
    ['/docs/blocks/ai-provider-picker', { platform: 'web', section: 'docs', slug: 'blocks/ai-provider-picker' }],
    ['/docs/components/base', { platform: 'web', section: 'components', base: 'base' }],
    ['/docs/components/base/tab-bar', { platform: 'web', section: 'components', base: 'base', name: 'tab-bar' }],
    ['/blocks/base', { platform: 'web', section: 'blocks', base: 'base' }],
    ['/native/docs', { platform: 'native', section: 'docs', slug: '' }],
    ['/native/docs/installation', { platform: 'native', section: 'docs', slug: 'installation' }],
    ['/native/components/uniwind', { platform: 'native', section: 'components', engine: 'uniwind' }],
    [
      '/native/components/nativewind/button',
      { platform: 'native', section: 'components', engine: 'nativewind', name: 'button' },
    ],
    ['/native/blocks/uniwind', { platform: 'native', section: 'blocks', engine: 'uniwind' }],
  ])('reads %s', (pathname, location) => {
    expect(platformLocation(pathname)).toEqual(location);
  });

  it('reads no engine from a segment outside the known set, so nothing links on under it', () => {
    expect(platformLocation('/native/components/foo/button')).toEqual({
      platform: 'native',
      section: 'components',
      name: 'button',
    });
    expect(platformLocation('/native/blocks/foo')).toEqual({ platform: 'native', section: 'blocks' });
  });
});

describe('platformCounterpart', () => {
  it.each([
    ['/', '/native'],
    ['/native', '/'],
    ['/docs/installation', '/native/docs/installation'],
    ['/docs', '/native/docs'],
    ['/docs/components/base/tab-bar', '/native/components/uniwind/tab-bar'],
    ['/docs/components/base', '/native/components/uniwind'],
    ['/blocks/base', '/native/blocks/uniwind'],
    ['/native/docs/installation', '/docs/installation'],
    ['/native/docs', '/docs'],
    ['/native/components/nativewind/tab-bar', '/docs/components/base/tab-bar'],
    ['/native/components/nativewind', '/docs/components/base'],
    ['/native/blocks/nativewind', '/blocks/base'],
  ])('sends %s to the same page on the other platform, %s', (pathname, counterpart) => {
    expect(platformCounterpart(platformLocation(pathname), PAGES, 'uniwind')).toBe(counterpart);
  });

  it.each([
    ['/docs/blocks/ai-provider-picker', '/native/docs'],
    ['/docs/components/base/copy-button', '/native/components/nativewind'],
    ['/native/components/uniwind/button', '/docs/components/base'],
    ['/view/ai-provider-picker', '/native/docs'],
  ])('sends %s, which the other platform lacks, to that section index, %s', (pathname, index) => {
    expect(platformCounterpart(platformLocation(pathname), PAGES, 'nativewind')).toBe(index);
  });
});

describe('platformHome', () => {
  it("points each platform's home link at that platform's home page", () => {
    expect(platformHome('web')).toBe('/');
    expect(platformHome('native')).toBe('/native');
  });
});

describe('platformNavItems', () => {
  it("points web's Docs, Components and Blocks into the web tree", () => {
    expect(platformNavItems('web', 'uniwind').map(({ label, href }) => [label, href])).toEqual([
      ['Docs', '/docs'],
      ['Components', '/docs/components/base'],
      ['Blocks', '/blocks/base'],
    ]);
  });

  it("points native's Docs, Components and Blocks into the native tree, under the engine given", () => {
    expect(platformNavItems('native', 'uniwind').map(({ label, href }) => [label, href])).toEqual([
      ['Docs', '/native/docs'],
      ['Components', '/native/components/uniwind'],
      ['Blocks', '/native/blocks/uniwind'],
    ]);
  });
});
