// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { currentSiteNavItem } from '@zeroxsolutions/ui/site/lib/site-nav';

import { nativeCounterpart, webNavItems } from './platform-nav';

describe('nativeCounterpart', () => {
  it.each([
    ['/', '/native'],
    ['/docs', '/native/docs'],
    ['/docs/installation', '/native/docs/installation'],
    ['/docs/components/base', '/native/components/uniwind'],
    ['/docs/components/base/tab-bar', '/native/components/uniwind/tab-bar'],
    ['/blocks/base', '/native/blocks/uniwind'],
    ['/icons/base', '/native/icons/uniwind'],
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

describe('webNavItems', () => {
  it("points the header's Docs, Components, Blocks, Icons and Editor into the web tree", () => {
    expect(webNavItems().map(({ label, href }) => [label, href])).toEqual([
      ['Docs', '/docs'],
      ['Components', '/docs/components/base'],
      ['Blocks', '/blocks/base'],
      ['Icons', '/icons/base'],
      ['Editor', '/docs/editor'],
    ]);
  });

  it.each([
    ['/docs/editor', 'Editor'],
    ['/docs/editor/document-editor', 'Editor'],
    ['/docs/installation', 'Docs'],
    ['/docs/editor-foo', 'Docs'],
    ['/icons/base', 'Icons'],
  ])('marks the item for %s', (pathname, label) => {
    expect(currentSiteNavItem(webNavItems(), pathname)?.label).toBe(label);
  });
});
