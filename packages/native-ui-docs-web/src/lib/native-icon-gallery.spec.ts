// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  ICON_GALLERY_PICK_MESSAGE,
  ICON_GALLERY_QUERY_MESSAGE,
  ICON_GALLERY_READY_MESSAGE,
  iconGalleryMessageOf,
  iconGalleryQueryMessage,
  nativeIconSets,
} from './native-icon-gallery';

/** The demo's side of the messages, in the native preview's icon gallery demo. */
const CHANNEL_SOURCE = join(import.meta.dirname, '../../../native-ui/src/examples/icon-gallery-channel.ts');

describe('the icon gallery messages', () => {
  it("are the ones the native preview's gallery demo posts and reads", () => {
    const channel = readFileSync(CHANNEL_SOURCE, 'utf8');

    expect(channel).toContain(`const ICON_GALLERY_QUERY_MESSAGE = '${ICON_GALLERY_QUERY_MESSAGE}';`);
    expect(channel).toContain(`const ICON_GALLERY_READY_MESSAGE = '${ICON_GALLERY_READY_MESSAGE}';`);
    expect(channel).toContain(`const ICON_GALLERY_PICK_MESSAGE = '${ICON_GALLERY_PICK_MESSAGE}';`);
  });

  it('sends the search as a query message', () => {
    expect(iconGalleryQueryMessage('arrow up')).toEqual({ type: ICON_GALLERY_QUERY_MESSAGE, query: 'arrow up' });
  });

  it('reads a ready and a pick message, and nothing else', () => {
    expect(iconGalleryMessageOf({ type: ICON_GALLERY_READY_MESSAGE })).toEqual({ kind: 'ready' });
    expect(iconGalleryMessageOf({ type: ICON_GALLERY_PICK_MESSAGE, name: 'lucide-copy-icon' })).toEqual({
      kind: 'pick',
      name: 'lucide-copy-icon',
    });
    expect(iconGalleryMessageOf({ type: ICON_GALLERY_PICK_MESSAGE, name: 3 })).toBeUndefined();
    expect(iconGalleryMessageOf({ type: 'zui:native-preview-height', height: 148 })).toBeUndefined();
    expect(iconGalleryMessageOf('ready')).toBeUndefined();
  });
});

describe('nativeIconSets', () => {
  it("holds every icon of the native registry's lucide folder, under its item name", () => {
    const registry = JSON.parse(
      readFileSync(join(import.meta.dirname, '../../../native-ui/registry.json'), 'utf8'),
    ) as { items: { name: string; files?: { path: string }[] }[] };
    const lucide = registry.items.filter((item) =>
      item.files?.some((file) => file.path.startsWith('src/registry/icons/lucide/')),
    );

    expect(nativeIconSets.map(({ set }) => set)).toEqual(['lucide']);
    expect(nativeIconSets[0]?.icons.map(({ name }) => name).sort()).toEqual(lucide.map(({ name }) => name).sort());
  });
});
