import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { fileInput, heldUpload, pngFile } from '../../../../../../../src/test/uploads';
import { standardKit } from '../standard/index';
import { card } from './card';
import { card as cardDefinition } from '@zeroxsolutions/editor-core/blocks/index';

describe('the card in the Document Editor', () => {
  it('is inserted from the slash menu and takes its image and its button link in popovers, its text in place', async () => {
    const editor = await mountDocumentEditor([standardKit(), card(cardDefinition)]);

    await insertFromSlashMenu('Card');
    await userEvent.click(page.getByRole('button', { name: 'Image', exact: true }));
    await userEvent.click(page.getByRole('textbox', { name: 'Image', exact: true }));
    await userEvent.keyboard('javascript:alert(1){Enter}');
    await expect
      .element(page.getByRole('textbox', { name: 'Image', exact: true }))
      .toHaveAttribute('aria-invalid', 'true');
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}https://i.test/hoi-an.jpg{Enter}');
    await findElement('[data-slot=card-image]');
    await userEvent.click(page.getByRole('textbox', { name: 'Title' }));
    await userEvent.keyboard('Hoi An');
    await userEvent.click(await findElement('[data-slot=card-text]'));
    await userEvent.keyboard('Lanterns');
    await userEvent.click(page.getByRole('textbox', { name: 'Add a button' }));
    await userEvent.keyboard('Read more');
    await userEvent.click(page.getByRole('button', { name: 'Button link' }));
    await userEvent.click(page.getByRole('textbox', { name: 'Button link' }));
    await userEvent.keyboard('https://guide.test{Enter}');

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

describe('the card with uploads', () => {
  it('uploads its image from the image popover, drawn faint until the address lands', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), card(cardDefinition, { upload })]);
    await insertFromSlashMenu('Card');
    await userEvent.click(page.getByRole('button', { name: 'Image', exact: true }));

    await userEvent.upload(fileInput(), pngFile());
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    expect((await findElement('[data-slot=card-image]')).getAttribute('src')).toMatch(/^blob:/);
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/blob:/);
    calls[0].answer('https://i.test/hoi-an.jpg');
    await vi.waitFor(() =>
      expect(editor.getJSON().content?.find((node) => node.type === 'card')?.attrs?.image).toBe(
        'https://i.test/hoi-an.jpg',
      ),
    );
  });

  it('ends its image upload when the author applies an address instead, which stays', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), card(cardDefinition, { upload })]);
    await insertFromSlashMenu('Card');
    await userEvent.click(page.getByRole('button', { name: 'Image', exact: true }));
    await userEvent.upload(fileInput(), pngFile());
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    await userEvent.click(page.getByRole('button', { name: 'Image', exact: true }));
    await userEvent.click(page.getByRole('tab', { name: 'Link' }));
    await userEvent.fill(page.getByRole('textbox', { name: 'Image', exact: true }), 'https://i.test/typed.jpg');
    await userEvent.keyboard('{Enter}');
    calls[0].answer('https://i.test/uploaded.jpg');

    await vi.waitFor(() => expect(calls[0].signal.aborted).toBe(true));
    expect(editor.getJSON().content?.find((node) => node.type === 'card')?.attrs?.image).toBe(
      'https://i.test/typed.jpg',
    );
  });
});
