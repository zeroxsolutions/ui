// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { nativeCounterpart, platformHome, platformNavItems } from './platform-nav';

describe('nativeCounterpart', () => {
  it.each([
    ['/', '/native'],
    ['/docs', '/native/docs'],
    ['/docs/installation', '/native/docs/installation'],
    ['/docs/components/base', '/native/components/uniwind'],
    ['/docs/components/base/tab-bar', '/native/components/uniwind/tab-bar'],
    ['/blocks/base', '/native/blocks/uniwind'],
    ['/view/ai-provider-picker', '/native/docs'],
  ])('moves %s to %s', (pathname, href) => {
    expect(nativeCounterpart(pathname, 'uniwind')).toBe(href);
  });

  it('moves a page the native tree lacks to the same place there, which answers 404 with its section', () => {
    expect(nativeCounterpart('/docs/components/base/copy-button', 'nativewind')).toBe(
      '/native/components/nativewind/copy-button',
    );
    expect(nativeCounterpart('/docs/blocks/ai-provider-picker', 'nativewind')).toBe(
      '/native/docs/blocks/ai-provider-picker',
    );
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
