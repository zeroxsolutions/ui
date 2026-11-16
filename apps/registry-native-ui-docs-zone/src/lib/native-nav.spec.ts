// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { webCounterpart, zoneHome, zoneNavItems } from './native-nav';

describe('webCounterpart', () => {
  it.each([
    ['/native', '/'],
    ['/native/docs', '/docs'],
    ['/native/docs/installation', '/docs/installation'],
    ['/native/components/uniwind', '/docs/components/base'],
    ['/native/components/nativewind/button', '/docs/components/base/button'],
    ['/native/blocks/uniwind', '/blocks/base'],
    ['/native/unknown', '/docs'],
  ])('moves %s to %s', (pathname, href) => {
    expect(webCounterpart(pathname)).toBe(href);
  });
});

describe('zoneHome', () => {
  it('points each platform at its own home', () => {
    expect(zoneHome('native')).toBe('/native');
    expect(zoneHome('web')).toBe('/');
  });
});

describe('zoneNavItems', () => {
  it('points the native sections under the engine', () => {
    expect(zoneNavItems('native', 'uniwind').map((item) => item.href)).toEqual([
      '/native/docs',
      '/native/components/uniwind',
      '/native/blocks/uniwind',
    ]);
  });

  it('points the web sections at the default base', () => {
    expect(zoneNavItems('web', 'uniwind').map((item) => item.href)).toEqual([
      '/docs',
      '/docs/components/base',
      '/blocks/base',
    ]);
  });
});
