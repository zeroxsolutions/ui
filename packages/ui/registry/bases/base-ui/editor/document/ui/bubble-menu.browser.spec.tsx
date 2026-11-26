import { useState, type ReactNode } from 'react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { findElement } from '../../../../../../src/test/document-editor';
import { heldUpload, pasteImage } from '../../../../../../src/test/uploads';
import { image } from '../features/image/image';
import { standardKit } from '../features/standard/index';
import { Editor } from '../react/editor';
import { BubbleMenu } from './bubble-menu';

const notes: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Notes for the bay' }] },
    { type: 'image', attrs: { src: 'https://cdn.test/old.png', alt: 'Bay' } },
    { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
  ],
};

function Harness({
  features,
  content = notes,
  onReady,
}: {
  features: EditorFeature[];
  content?: DocJSON;
  onReady(editor: IEditor): void;
}): ReactNode {
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [bubble] = useState(() => collectUiContributions(features).bubble);
  return (
    <div className="style-nova" style={{ padding: '80px' }}>
      <Editor
        features={features}
        content={content}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <BubbleMenu editor={editor} items={bubble} />}
    </div>
  );
}

async function mount(features: EditorFeature[], { content }: { content?: DocJSON } = {}): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(<Harness features={features} content={content} onReady={(editor) => (ready = editor)} />);
  return vi.waitFor(() => {
    if (ready === null || document.querySelector('.ProseMirror') === null) throw new Error('the editor is not mounted');
    return ready;
  });
}

const bubble = (): Element | null => page.getByTestId('bubble-menu').query();

/** Selects the words of the paragraph holding "Notes" and waits for the bubble over them. */
async function selectNotes(): Promise<void> {
  await userEvent.tripleClick(page.getByText('Notes for the bay'));
  await vi.waitFor(() => expect(bubble()).not.toBeNull());
}

describe('the bubble menu', () => {
  it('hides once a pasted image puts a block in place of the selected text', async () => {
    const { upload, calls } = heldUpload();
    await mount([standardKit(), image({ upload })]);
    await selectNotes();

    await pasteImage();

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await vi.waitFor(() => expect(bubble()).toBeNull());
  });

  it('stays hidden over a caret, and shows once the caret takes a word', async () => {
    await mount([standardKit(), image()]);
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{End}');
    await expect.element(page.getByTestId('bubble-menu')).not.toBeInTheDocument();

    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');

    await expect.element(page.getByTestId('bubble-menu')).toBeVisible();
  });

  it('stays hidden over a selected image', async () => {
    const editor = await mount([standardKit(), image()]);
    // The image's own controls cover it, so it is picked up by its grip, whose menu is then closed.
    // The pointer rests on the image's block, which holds the image with its Edit control and
    // resize handles over it.
    await userEvent.hover(page.getByTestId('block-layout'));
    const grip = await vi.waitFor(() => {
      const found = document.querySelector<HTMLElement>('.drag-handle:not(.hide)');
      if (!found) throw new Error('the grip is not shown');
      return found;
    });
    await userEvent.click(grip);
    await userEvent.keyboard('{Escape}');

    await vi.waitFor(() => expect(editor.getSelection()).toMatchObject({ isNode: true }));
    await expect.element(page.getByTestId('bubble-menu')).not.toBeInTheDocument();
  });

  it('hides once a command puts a block in place of the selected text', async () => {
    const editor = await mount([standardKit(), image()]);
    await selectNotes();

    editor.run('insertImage', { src: 'https://cdn.test/cat.png' });

    await vi.waitFor(() => expect(JSON.stringify(editor.getJSON())).toContain('https://cdn.test/cat.png'));
    await vi.waitFor(() => expect(bubble()).toBeNull());
  });
});

const line = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

const plain: DocJSON = { type: 'doc', content: [line('Notes for the bay'), line('Trip')] };

const mixed: DocJSON = {
  type: 'doc',
  content: [
    line('Notes for the bay'),
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tides' }] },
    { type: 'blockquote', content: [line('Said the keeper')] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [line('Rope')] }] },
  ],
};

/** The `textAlign` of every paragraph and heading in `editor`'s document, in order. */
function alignments(editor: IEditor): unknown[] {
  const found: unknown[] = [];
  const walk = (node: { type: string; attrs?: Record<string, unknown>; content?: unknown[] }) => {
    if (node.type === 'paragraph' || node.type === 'heading') found.push(node.attrs?.textAlign ?? null);
    for (const child of node.content ?? []) walk(child as typeof node);
  };
  walk(editor.getJSON());
  return found;
}

/** The marks on the text of the first paragraph. */
const firstMarks = (editor: IEditor) => editor.getJSON().content?.[0]?.content?.[0]?.marks ?? [];

async function openColors(): Promise<void> {
  await userEvent.click(page.getByRole('button', { name: 'Text color' }));
  await expect.element(page.getByRole('dialog', { name: 'Text color' })).toBeVisible();
}

const swatch = (group: 'Text color' | 'Background', name: string) =>
  page.getByRole('dialog', { name: 'Text color' }).getByRole('group', { name: group }).getByRole('button', { name });

describe('the bubble menu text alignment', () => {
  it('aligns every paragraph the selection touches, in a quote and a list too', async () => {
    const editor = await mount([standardKit()], { content: mixed });
    await userEvent.click(page.getByText('Notes for the bay'));
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await vi.waitFor(() => expect(bubble()).not.toBeNull());

    await userEvent.click(
      page.getByRole('group', { name: 'Text alignment' }).getByRole('button', { name: 'Align center' }),
    );

    // The editor keeps an empty line after the list, which the selection takes too.
    await vi.waitFor(() => expect(alignments(editor)).toEqual(['center', 'center', 'center', 'center', 'center']));
  });

  it('keeps every control in view on a screen narrower than its row, the colours and justify included', async () => {
    await page.viewport(320, 800);
    onTestFinished(() => page.viewport(414, 896));
    await mount([standardKit()], { content: plain });
    await selectNotes();

    const controls = page.getByRole('toolbar').getByRole('button');
    await expect.element(page.getByRole('toolbar').getByRole('button', { name: 'Text color' })).toBeVisible();
    for (const control of controls.all()) await expect.element(control).toBeInViewport({ ratio: 0.99 });
  });

  it('offers justify in the Document Editor and shows the alignment the selection has', async () => {
    await mount([standardKit()], {
      content: { type: 'doc', content: [{ ...line('Notes for the bay'), attrs: { textAlign: 'end' } }] },
    });
    await selectNotes();

    const group = page.getByRole('group', { name: 'Text alignment' });
    await expect.element(group.getByRole('button', { name: 'Justify' })).toBeVisible();
    await expect.element(group.getByRole('button', { name: 'Align right' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('the bubble menu colours', () => {
  it('colours the selection red with the textColor mark, and Default takes it away', async () => {
    const editor = await mount([standardKit()], { content: plain });
    await selectNotes();
    await openColors();

    await userEvent.click(swatch('Text color', 'Red'));
    await vi.waitFor(() => expect(firstMarks(editor)).toEqual([{ type: 'textColor', attrs: { token: 'red' } }]));

    await expect.element(swatch('Text color', 'Red')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(swatch('Text color', 'Default'));
    await vi.waitFor(() => expect(firstMarks(editor)).toEqual([]));
  });

  it('sets a background beside the text colour', async () => {
    const editor = await mount([standardKit()], { content: plain });
    await selectNotes();
    await openColors();

    await userEvent.click(swatch('Background', 'Amber'));

    await vi.waitFor(() => expect(firstMarks(editor)).toEqual([{ type: 'textBackground', attrs: { token: 'amber' } }]));
  });

  it('presses the swatch picked as the colour lands, and Default no longer', async () => {
    const editor = await mount([standardKit()], { content: plain });
    await selectNotes();
    await openColors();
    const amber = swatch('Background', 'Amber').element();
    const fallback = swatch('Background', 'Default').element();
    // Read as the editor draws the colour, before the browser draws another frame.
    const seen: string[] = [];
    const text = (await findElement('.ProseMirror')) as HTMLElement;
    const drawn = new MutationObserver(() => {
      if (seen.length === 0 && text.querySelector('[data-bg=amber]')) {
        seen.push(`${amber.getAttribute('aria-pressed')} ${fallback.getAttribute('aria-pressed')}`);
      }
    });
    drawn.observe(text, { subtree: true, childList: true, attributes: true });

    await userEvent.click(amber);

    await vi.waitFor(() => expect(seen).toHaveLength(1));
    drawn.disconnect();
    expect(seen).toEqual(['true false']);
    expect(firstMarks(editor)).toEqual([{ type: 'textBackground', attrs: { token: 'amber' } }]);
  });

  it('opens on a selection that carries a background with its swatch pressed', async () => {
    const amber: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Notes for the bay', marks: [{ type: 'textBackground', attrs: { token: 'amber' } }] },
          ],
        },
        line('Trip'),
      ],
    };
    await mount([standardKit()], { content: amber });
    await selectNotes();
    await openColors();

    expect(swatch('Background', 'Amber').element().getAttribute('aria-pressed')).toBe('true');
    expect(swatch('Background', 'Default').element().getAttribute('aria-pressed')).toBe('false');
    expect(swatch('Text color', 'Default').element().getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the bubble and the selection while the menu is open', async () => {
    const editor = await mount([standardKit()], { content: plain });
    await selectNotes();
    const before = editor.getSelection();
    await openColors();

    expect(bubble()).not.toBeNull();
    expect(editor.getSelection()).toMatchObject({ from: before.from, to: before.to });
    await userEvent.click(swatch('Text color', 'Blue'));
    await vi.waitFor(() => expect(firstMarks(editor)).toEqual([{ type: 'textColor', attrs: { token: 'blue' } }]));
    expect(editor.getSelection()).toMatchObject({ from: before.from, to: before.to });
  });

  it('moves between the swatches by keyboard', async () => {
    const editor = await mount([standardKit()], { content: plain });
    await selectNotes();
    await openColors();

    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Default'));
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');

    await vi.waitFor(() => expect(firstMarks(editor)).toEqual([{ type: 'textColor', attrs: { token: 'primary' } }]));
  });
});

describe('pasted HTML', () => {
  it('maps an inline colour that names a hue and an alignment, and drops the rest', async () => {
    const editor = await mount([standardKit()], { content: plain });
    const html =
      '<p>Lead-in</p><p style="color:#ff0000;text-align:right;width:300px;background:rgb(1,2,3)">Loud</p>' +
      '<p><span style="color:red">Red</span> <span style="color:#00ff00">Hex</span></p>';
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })]);
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{End}');
    await userEvent.paste();

    await vi.waitFor(() => expect(editor.getText()).toContain('Hex'));
    const json = editor.getJSON();
    const loud = json.content?.find((node) => node.content?.[0]?.text?.startsWith('Loud'));
    expect(loud?.attrs?.textAlign).toBe('end');
    const red = json.content?.flatMap((node) => node.content ?? []).find((node) => node.text === 'Red');
    expect(red?.marks).toEqual([{ type: 'textColor', attrs: { token: 'red' } }]);
    expect(JSON.stringify(json)).not.toMatch(/\d+px|#[0-9a-f]{3,8}|rgb\(/i);
  });
});
