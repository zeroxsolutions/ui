import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { standardKit } from '../standard/index';
import { toggleHeading } from './toggle-heading';

describe('the toggle heading in the Document Editor', () => {
  it('is inserted from the slash menu as a heading, and folds what follows it', async () => {
    const editor = await mountDocumentEditor([standardKit(), toggleHeading()]);

    await insertFromSlashMenu('Toggle heading 2');
    await userEvent.keyboard('Day one{Enter}Walk the old town');

    const node = editor.getJSON().content?.find((child) => child.type === 'toggleHeading');
    expect(node?.content?.map((child) => child.type)).toEqual(['heading', 'paragraph']);
    expect(node?.content?.[0]?.attrs?.level).toBe(2);

    const body = page.getByText('Walk the old town');
    const title = page.getByRole('heading', { level: 2, name: 'Day one' });
    await expect.element(body).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Collapse' }));

    await expect.element(body).not.toBeVisible();
    await expect.element(title).toBeVisible();
    expect(editor.getJSON().content?.find((child) => child.type === 'toggleHeading')?.attrs?.open).toBe(false);
  });
});
