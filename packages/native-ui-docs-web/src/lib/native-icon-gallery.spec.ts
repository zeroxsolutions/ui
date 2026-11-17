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
  nativeIconUsage,
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

  it('sends the search read as a glyph name, as the page counts it, so the demo only checks that a glyph holds it', () => {
    for (const [typed, query] of [
      ['Arrow Up', 'arrow-up'],
      ['  copy ', 'copy'],
      ['ARROW-up', 'arrow-up'],
      ['', ''],
    ]) {
      expect(iconGalleryQueryMessage(typed)).toEqual({ type: ICON_GALLERY_QUERY_MESSAGE, query });
    }
  });

  it('sends the icon picked on the page with the search', () => {
    expect(iconGalleryQueryMessage('copy', 'lucide-copy-icon')).toEqual({
      type: ICON_GALLERY_QUERY_MESSAGE,
      query: 'copy',
      picked: 'lucide-copy-icon',
    });
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

describe('nativeIconUsage', () => {
  it('imports the icon from where the CLI writes it, draws it through Icon and plays it from iconTrigger', () => {
    const usage = nativeIconUsage('lucide', 'arrow-up');

    expect(usage).toContain(
      "import { ArrowUpIcon, type ArrowUpIconHandle } from '@/components/general/lucide/arrow-up-icon';",
    );
    expect(usage).toContain("import { iconTrigger } from '@/lib/icon-motion';");
    expect(usage).toContain('<Pressable {...iconTrigger([icon], {})} onPress={onPress}>');
    expect(usage).toContain('<Icon as={ArrowUpIcon} ref={icon} />');
    expect(usage).not.toContain('stopAnimation');
  });
});
