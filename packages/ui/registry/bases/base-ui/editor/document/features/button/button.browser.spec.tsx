import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { callout } from '../callout/index';
import { columns } from '../columns/index';
import { standardKit } from '../standard/index';
import { button } from './button';

const features: EditorFeature[] = [standardKit(), button(), columns(), callout()];

describe('the button in the Document Editor', () => {
  it('inserts from the slash menu, and stores the label typed and the link set in its popover', async () => {
    const editor = await mountDocumentEditor(features);
    await insertFromSlashMenu('Button');

    await userEvent.fill(page.getByRole('textbox', { name: 'Button label' }), 'Book now');
    await userEvent.click(page.getByRole('button', { name: 'Link' }));
    await userEvent.fill(page.getByRole('textbox', { name: 'Link' }), 'https://x.test/book');
    await userEvent.click(page.getByRole('textbox', { name: 'Button label' }));

    await vi.waitFor(() =>
      expect(editor.getJSON().content?.find((node) => node.type === 'button')?.attrs).toMatchObject({
        label: 'Book now',
        href: 'https://x.test/book',
      }),
    );
  });
});
