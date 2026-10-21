// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  platformCounterpart,
  platformLocation,
  platformNavItems,
  withLocationEngine,
  withNativeEngine,
  type PlatformPages,
} from './platform-nav';

const PAGES: PlatformPages = {
  web: { docs: ['', 'installation', 'blocks/ai-provider-picker'], components: ['tab-bar', 'copy-button'] },
  native: { docs: ['', 'installation'], components: ['tab-bar', 'button'] },
};

describe('platformLocation', () => {
  it.each([
    ['/', { platform: 'web', section: 'other' }],
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
    ['/', '/native/docs'],
  ])('sends %s, which the other platform lacks, to that section index, %s', (pathname, index) => {
    expect(platformCounterpart(platformLocation(pathname), PAGES, 'nativewind')).toBe(index);
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

describe('withLocationEngine', () => {
  it('moves a component page, the components index and the blocks page to the other engine', () => {
    expect(withLocationEngine(platformLocation('/native/components/nativewind/button'), 'uniwind')).toBe(
      '/native/components/uniwind/button',
    );
    expect(withLocationEngine(platformLocation('/native/components/nativewind'), 'uniwind')).toBe(
      '/native/components/uniwind',
    );
    expect(withLocationEngine(platformLocation('/native/blocks/uniwind'), 'nativewind')).toBe(
      '/native/blocks/nativewind',
    );
  });

  it('has nothing to move on a page whose path holds no engine', () => {
    expect(withLocationEngine(platformLocation('/native/docs/installation'), 'uniwind')).toBeUndefined();
  });
});

describe('withNativeEngine', () => {
  it("rewrites a native component link's engine, keeping its fragment and query", () => {
    expect(withNativeEngine('/native/components/nativewind/text', 'uniwind')).toBe('/native/components/uniwind/text');
    expect(withNativeEngine('/native/components/nativewind/theme#fonts', 'uniwind')).toBe(
      '/native/components/uniwind/theme#fonts',
    );
    expect(withNativeEngine('/native/components/nativewind?style=nova', 'uniwind')).toBe(
      '/native/components/uniwind?style=nova',
    );
  });

  it('leaves every other link as it is', () => {
    for (const href of [
      '/native/docs/installation#load-the-fonts',
      '/docs/components/base',
      'https://nativewind.dev',
      '#usage',
    ]) {
      expect(withNativeEngine(href, 'uniwind')).toBe(href);
    }
  });
});
