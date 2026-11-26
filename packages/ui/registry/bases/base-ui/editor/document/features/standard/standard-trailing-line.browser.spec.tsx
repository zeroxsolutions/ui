import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { bookmark } from '../bookmark/index';
import { file } from '../file/index';
import { media } from '../media/index';
import { standardKit } from './standard-kit';

/** The blocks a press selects whole, each as the last block of a document. */
const lastBlocks: Record<string, NodeJSON> = {
  bookmark: { type: 'bookmark', attrs: { url: 'https://example.com/hoi-an', title: 'Hoi An' } },
  file: { type: 'file', attrs: { href: 'https://cdn.test/menu.pdf', name: 'menu.pdf' } },
  video: { type: 'media', attrs: { src: 'https://cdn.test/hoi-an.mp4', kind: 'video' } },
};

const thrown: string[] = [];
const record = (event: ErrorEvent) => thrown.push(event.message);

afterEach(() => {
  window.removeEventListener('error', record);
  thrown.length = 0;
});

describe('the trailing line of a document', () => {
  it.each(Object.keys(lastBlocks))(
    'is there before the first press on a %s the document ends on, which selects it',
    async (name) => {
      await page.viewport(1000, 700);
      window.addEventListener('error', record);
      const doc: DocJSON = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Before' }] }, lastBlocks[name]!],
      };
      const editor = await mountDocumentEditor([standardKit(), bookmark(), file(), media()], doc);
      expect(editor.getJSON().content?.at(-1)?.type).toBe('paragraph');
      await userEvent.click(page.getByTestId('block-layout'), { position: { x: 20, y: 10 } });

      await vi.waitFor(() => expect(editor.getSelection()).toMatchObject({ from: 8, isNode: true }));
      expect(thrown).toEqual([]);
    },
  );

  it('is left out where the kit keeps none', async () => {
    const doc: DocJSON = { type: 'doc', content: [lastBlocks.file!] };
    const editor = await mountDocumentEditor([standardKit({ trailingNode: false }), file()], doc);
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual(['file']);
  });
});
