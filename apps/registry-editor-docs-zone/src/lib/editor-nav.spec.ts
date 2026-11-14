// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { inZone, zoneNavItems } from './editor-nav';

describe('inZone', () => {
  it.each(['/docs/editor', '/docs/editor/document-editor', '/docs/editor/math-editor#usage', '#usage'])(
    'keeps %s in this zone',
    (href) => {
      expect(inZone(href)).toBe(true);
    },
  );

  it.each(['/', '/docs', '/docs/installation', '/docs/editor-foo', '/docs/components/base/button', '/native/docs'])(
    'hands %s to another zone',
    (href) => {
      expect(inZone(href)).toBe(false);
    },
  );
});

describe('zoneNavItems', () => {
  it('points the sections into the web tree at the default base', () => {
    expect(zoneNavItems().map((item) => item.href)).toEqual(['/docs', '/docs/components/base', '/blocks/base']);
  });
});
