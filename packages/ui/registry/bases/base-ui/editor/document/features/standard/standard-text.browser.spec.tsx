import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { Editor } from '../../react/editor';
import { standardKit } from './standard-kit';

const line = (text: string, attrs?: Record<string, unknown>) => ({
  type: 'paragraph',
  ...(attrs ? { attrs } : {}),
  content: [{ type: 'text', text }],
});

async function mount(content: DocJSON): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(
    <div className="style-nova" style={{ padding: '0 80px' }}>
      <Editor features={[standardKit()]} content={content} onReady={(editor) => (ready = editor)} />
    </div>,
  );
  return vi.waitFor(() => {
    if (ready === null || document.querySelector('.ProseMirror') === null) throw new Error('the editor is not mounted');
    return ready;
  });
}

/**
 * Points at the left of the block reading `text` and answers its grip once it shows. The grip is the drag handle
 * extension's own node, with no role, name or slot to find it by. Its `hide` class hides it at opacity 0, which a
 * visibility check does not read.
 */
async function gripOf(text: string): Promise<HTMLElement> {
  await userEvent.hover(page.getByText(text, { exact: true }), { position: { x: 4, y: 4 } });
  return vi.waitFor(() => {
    const handle = document.querySelector<HTMLElement>('.drag-handle');
    if (!handle || handle.classList.contains('hide')) throw new Error('the grip is hidden');
    return handle;
  });
}

/** Opens the grip menu of the block reading `text` and picks `choice` under Turn into. */
async function turnInto(text: string, choice: string): Promise<void> {
  await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
  await userEvent.click(await gripOf(text));
  await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));
  await userEvent.click(page.getByRole('menuitemradio', { name: choice, exact: true }));
}

const first = (editor: IEditor) => editor.getJSON().content?.[0];

describe('paragraph styles in Turn into', () => {
  it('turns a paragraph into Lead and Small text, and back to Text', async () => {
    const editor = await mount({ type: 'doc', content: [line('Welcome aboard'), line('after')] });

    await turnInto('Welcome aboard', 'Lead');
    await vi.waitFor(() => expect(first(editor)?.attrs?.size).toBe('lead'));

    await turnInto('Welcome aboard', 'Small text');
    await vi.waitFor(() => expect(first(editor)?.attrs?.size).toBe('small'));

    await turnInto('Welcome aboard', 'Text');
    await vi.waitFor(() => expect(first(editor)?.attrs?.size ?? null).toBeNull());
    expect(first(editor)).toMatchObject({ type: 'paragraph', content: [{ text: 'Welcome aboard' }] });
  });

  it('checks the style the paragraph has', async () => {
    await mount({ type: 'doc', content: [line('Welcome aboard', { size: 'lead' }), line('after')] });
    await userEvent.click(await gripOf('Welcome aboard'));
    await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));

    await expect.element(page.getByRole('menuitemradio', { name: 'Lead' })).toHaveAttribute('aria-checked', 'true');
    await expect
      .element(page.getByRole('menuitemradio', { name: 'Text', exact: true }))
      .toHaveAttribute('aria-checked', 'false');
  });

  it('turns a heading into Lead keeping its text', async () => {
    const editor = await mount({
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tides' }] }, line('after')],
    });

    await turnInto('Tides', 'Lead');

    await vi.waitFor(() =>
      expect(first(editor)).toMatchObject({ type: 'paragraph', attrs: { size: 'lead' }, content: [{ text: 'Tides' }] }),
    );
  });
});
