import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../blocks/block-feature.testing';
import { standardKit } from '../standard/index';
import { bookmark } from './bookmark';

describe('the bookmark in the Document Editor', () => {
  it('is inserted from the slash menu and fills its preview once from the address pasted in it', async () => {
    const readLink = vi.fn(async () => ({
      title: 'Hoi An guide',
      description: 'Lanterns and tailors',
      image: 'javascript:alert(1)',
    }));
    const editor = await mountDocumentEditor([standardKit(), bookmark({ readLink })]);

    await insertFromSlashMenu('Bookmark');
    await userEvent.click(page.getByRole('textbox', { name: 'Link' }));
    await userEvent.keyboard('https://example.com/hoi-an{Enter}');

    const title = await findElement('[data-slot=bookmark-title]', 'Hoi An guide');
    expect(title).toBeTruthy();
    expect(readLink).toHaveBeenCalledTimes(1);
    expect(readLink).toHaveBeenCalledWith('https://example.com/hoi-an');
    expect(editor.getJSON().content?.find((node) => node.type === 'bookmark')?.attrs).toMatchObject({
      url: 'https://example.com/hoi-an',
      title: 'Hoi An guide',
      description: 'Lanterns and tailors',
      image: '',
    });
  });

  it('keeps showing the address when the host cannot read the page', async () => {
    const readLink = vi.fn(async () => {
      throw new Error('offline');
    });
    await mountDocumentEditor([standardKit(), bookmark({ readLink })]);

    await insertFromSlashMenu('Bookmark');
    await userEvent.click(page.getByRole('textbox', { name: 'Link' }));
    await userEvent.keyboard('https://example.com/x{Enter}');

    await vi.waitFor(() => expect(readLink).toHaveBeenCalledTimes(1));
    expect((await findElement('[data-slot=bookmark-title]')).textContent).toBe('https://example.com/x');
  });
});
