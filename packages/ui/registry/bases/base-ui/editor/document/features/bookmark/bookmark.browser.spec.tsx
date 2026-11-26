import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { expectViewerMatches, layoutFrame, storedLayout } from '../../../../../../../test/block-layout';
import { insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
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

    await expect.element(page.getByTestId('bookmark-title')).toHaveTextContent('Hoi An guide');
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
    await expect.element(page.getByTestId('bookmark-title')).toHaveTextContent('https://example.com/x');
  });

  it('asks the host for no preview of a mail address', async () => {
    const readLink = vi.fn(async () => ({ title: 'x' }));
    await mountDocumentEditor([standardKit(), bookmark({ readLink })]);

    await insertFromSlashMenu('Bookmark');
    await userEvent.click(page.getByRole('textbox', { name: 'Link' }));
    await userEvent.keyboard('mailto:lan@example.com{Enter}');

    await expect.element(page.getByTestId('bookmark-title')).toHaveTextContent('mailto:lan@example.com');
    expect(readLink).not.toHaveBeenCalled();
  });
});

describe('the bookmark layout', () => {
  const features = [standardKit(), bookmark()];
  const laidOut = (layout: Record<string, unknown>): DocJSON => ({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
      { type: 'bookmark', attrs: { url: 'https://example.com/hoi-an', title: 'Hoi An', ...layout } },
    ],
  });

  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('align sets data-align in the Editor and the Viewer', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({}));
    await userEvent.click(layoutFrame(), { position: { x: 4, y: 4 } });
    await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Align center' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1).align).toBe('center'));
    await expectViewerMatches(editor, features);
  });

  it('no resize handle and no full width toggle is drawn', async () => {
    await mountDocumentEditor(features, laidOut({}));
    await userEvent.click(layoutFrame(), { position: { x: 4, y: 4 } });
    await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();

    expect(page.getByTestId('resize-handle').query()).toBeNull();
    expect(
      page.getByRole('toolbar', { name: 'Block layout' }).getByRole('button', { name: 'Full width' }).query(),
    ).toBeNull();
  });
});
