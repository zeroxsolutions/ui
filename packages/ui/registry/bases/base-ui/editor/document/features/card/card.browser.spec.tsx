import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { standardKit } from '../standard/index';
import { card } from './card';
import { card as cardDefinition } from '@zeroxsolutions/editor-core/blocks/index';

describe('the card in the Document Editor', () => {
  it('is inserted from the slash menu and takes its image, title, text and button', async () => {
    const editor = await mountDocumentEditor([standardKit(), card(cardDefinition)]);

    await insertFromSlashMenu('Card');
    await userEvent.click(page.getByRole('textbox', { name: 'Image link' }));
    await userEvent.keyboard('https://i.test/hoi-an.jpg{Enter}');
    await findElement('[data-slot=card-image]');
    await userEvent.click(page.getByRole('textbox', { name: 'Title' }));
    await userEvent.keyboard('Hoi An');
    await userEvent.click(await findElement('[data-slot=card-text]'));
    await userEvent.keyboard('Lanterns');
    await userEvent.click(page.getByRole('textbox', { name: 'Button label' }));
    await userEvent.keyboard('Read more');
    await userEvent.click(page.getByRole('textbox', { name: 'Button link' }));
    await userEvent.keyboard('https://guide.test');

    await expect
      .poll(() => editor.getJSON().content?.find((node) => node.type === 'card'))
      .toMatchObject({
        attrs: {
          image: 'https://i.test/hoi-an.jpg',
          heading: 'Hoi An',
          buttonLabel: 'Read more',
          buttonHref: 'https://guide.test',
        },
        content: [{ type: 'text', text: 'Lanterns' }],
      });
  });
});
