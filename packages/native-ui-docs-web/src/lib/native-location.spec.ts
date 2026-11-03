// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { nativeLocation, type NativeLocation, withLocationEngine, withNativeEngine } from './native-location';

function located(pathname: string): NativeLocation {
  const location = nativeLocation(pathname);
  if (!location) throw new Error(`${pathname} is outside the native tree`);
  return location;
}

describe('nativeLocation', () => {
  it.each([
    ['/native', { platform: 'native', section: 'home' }],
    ['/native/docs', { platform: 'native', section: 'docs', slug: '' }],
    ['/native/docs/installation', { platform: 'native', section: 'docs', slug: 'installation' }],
    ['/native/components/uniwind', { platform: 'native', section: 'components', engine: 'uniwind' }],
    [
      '/native/components/nativewind/button',
      { platform: 'native', section: 'components', engine: 'nativewind', name: 'button' },
    ],
    ['/native/blocks/uniwind', { platform: 'native', section: 'blocks', engine: 'uniwind' }],
  ])('reads %s', (pathname, location) => {
    expect(nativeLocation(pathname)).toEqual(location);
  });

  it('reads no engine from a segment outside the known set, so nothing links on under it', () => {
    expect(nativeLocation('/native/components/foo/button')).toEqual({
      platform: 'native',
      section: 'components',
      name: 'button',
    });
    expect(nativeLocation('/native/blocks/foo')).toEqual({ platform: 'native', section: 'blocks' });
  });

  it('reads nothing from a path outside the native tree', () => {
    expect(nativeLocation('/docs/components/base')).toBeUndefined();
  });
});

describe('withLocationEngine', () => {
  it('moves a component page, the components index and the blocks page to the other engine', () => {
    expect(withLocationEngine(located('/native/components/nativewind/button'), 'uniwind')).toBe(
      '/native/components/uniwind/button',
    );
    expect(withLocationEngine(located('/native/components/nativewind'), 'uniwind')).toBe('/native/components/uniwind');
    expect(withLocationEngine(located('/native/blocks/uniwind'), 'nativewind')).toBe('/native/blocks/nativewind');
  });

  it('has nothing to move on a page whose path holds no engine', () => {
    expect(withLocationEngine(located('/native/docs/installation'), 'uniwind')).toBeUndefined();
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
