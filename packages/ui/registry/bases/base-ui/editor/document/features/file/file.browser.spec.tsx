import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../blocks/block-feature.testing';
import { standardKit } from '../standard/index';
import { file } from './file';

describe('the file block in the Document Editor', () => {
  it('is inserted from the slash menu and named after the file its link reaches', async () => {
    const editor = await mountDocumentEditor([standardKit(), file()]);

    await insertFromSlashMenu('File');
    await userEvent.click(page.getByRole('textbox', { name: 'File link' }));
    await userEvent.keyboard('https://files.test/docs/trip%20plan.pdf{Enter}');

    expect((await findElement('[data-slot=file-name]')).textContent).toBe('trip plan.pdf');
    expect(editor.getJSON().content?.find((node) => node.type === 'file')?.attrs).toMatchObject({
      href: 'https://files.test/docs/trip%20plan.pdf',
      name: 'trip plan.pdf',
    });
  });
});
