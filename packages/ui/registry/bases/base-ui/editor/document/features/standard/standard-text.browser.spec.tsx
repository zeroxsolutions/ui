import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement } from '../../../../../../../src/test/document-editor';
import { Editor } from '../../react/editor';
import { Viewer } from '../../react/viewer';
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

/** Opens the grip menu of the block holding `text` and picks `choice` under Turn into. */
async function turnInto(selector: string, text: string, choice: string): Promise<void> {
  await vi.waitFor(() => expect(document.querySelector('[role=menu]')).toBeNull());
  await userEvent.hover(await findElement(selector, text), { position: { x: 4, y: 4 } });
  const grip = await vi.waitFor(() => {
    const found = document.querySelector<HTMLElement>('.drag-handle');
    if (!found || found.classList.contains('hide')) throw new Error('the grip is hidden');
    return found;
  });
  await userEvent.click(grip);
  await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));
  await userEvent.click(page.getByRole('menuitemradio', { name: choice, exact: true }));
}

const first = (editor: IEditor) => editor.getJSON().content?.[0];

describe('paragraph styles in Turn into', () => {
  it('turns a paragraph into Lead and Small text, and back to Text', async () => {
    const editor = await mount({ type: 'doc', content: [line('Welcome aboard'), line('after')] });

    await turnInto('.ProseMirror p', 'Welcome aboard', 'Lead');
    await vi.waitFor(() => expect(first(editor)?.attrs?.size).toBe('lead'));

    await turnInto('.ProseMirror p', 'Welcome aboard', 'Small text');
    await vi.waitFor(() => expect(first(editor)?.attrs?.size).toBe('small'));

    await turnInto('.ProseMirror p', 'Welcome aboard', 'Text');
    await vi.waitFor(() => expect(first(editor)?.attrs?.size ?? null).toBeNull());
    expect(first(editor)).toMatchObject({ type: 'paragraph', content: [{ text: 'Welcome aboard' }] });
  });

  it('checks the style the paragraph has', async () => {
    await mount({ type: 'doc', content: [line('Welcome aboard', { size: 'lead' }), line('after')] });
    await userEvent.hover(await findElement('.ProseMirror p', 'Welcome aboard'), { position: { x: 4, y: 4 } });
    await userEvent.click(
      await vi.waitFor(() => {
        const found = document.querySelector<HTMLElement>('.drag-handle');
        if (!found || found.classList.contains('hide')) throw new Error('the grip is hidden');
        return found;
      }),
    );
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

    await turnInto('.ProseMirror h2', 'Tides', 'Lead');

    await vi.waitFor(() =>
      expect(first(editor)).toMatchObject({ type: 'paragraph', attrs: { size: 'lead' }, content: [{ text: 'Tides' }] }),
    );
  });
});

describe('the Viewer', () => {
  it('draws the alignment and the size the editor draws', async () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        line('Lead line', { textAlign: 'center', size: 'lead' }),
        line('Fine print', { textAlign: 'end', size: 'small' }),
        { type: 'heading', attrs: { level: 2, textAlign: 'justify' }, content: [{ type: 'text', text: 'Tides' }] },
      ],
    };
    await render(
      <div className="style-nova" style={{ width: '640px' }}>
        <div data-testid="editor">
          <Editor features={[standardKit()]} content={doc} />
        </div>
        <div data-testid="viewer">
          <Viewer doc={doc} features={[standardKit()]} />
        </div>
      </div>,
    );
    const pair = (selector: string, text: string) =>
      vi.waitFor(() => {
        const inEditor = [...document.querySelectorAll<HTMLElement>(`[data-testid=editor] ${selector}`)];
        const inViewer = [...document.querySelectorAll<HTMLElement>(`[data-testid=viewer] ${selector}`)];
        const drawn = inEditor.find((element) => element.textContent === text);
        const viewed = inViewer.find((element) => element.textContent === text);
        if (!drawn || !viewed) throw new Error(`${text} is not drawn in both`);
        return [getComputedStyle(drawn), getComputedStyle(viewed)] as const;
      });

    for (const [selector, text] of [
      ['p', 'Lead line'],
      ['p', 'Fine print'],
      ['h2', 'Tides'],
    ] as const) {
      const [drawn, viewed] = await pair(selector, text);
      expect(viewed.textAlign).toBe(drawn.textAlign);
      expect(viewed.fontSize).toBe(drawn.fontSize);
    }
    const [lead] = await pair('p', 'Lead line');
    const [small] = await pair('p', 'Fine print');
    expect(lead.textAlign).toBe('center');
    expect(parseFloat(lead.fontSize)).toBeGreaterThan(parseFloat(small.fontSize));
  });
});
