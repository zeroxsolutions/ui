import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { z } from 'zod';
import {
  defineFeature,
  type DocJSON,
  type EditorFeature,
  type IEditor,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { standardKit } from '../features/standard/index';
import { Editor } from '../react/editor';
import { AlignControl } from './align-control';
import { BlockToolbar } from './block-toolbar';
import { layoutProps } from './layout-props';
import { DEFAULT_LAYOUT_WORDS, type LayoutWords } from './layout-words';
import { WidthToggle } from './width-toggle';

/** Words of another catalogue, so a name drawn from the English would show. */
const words: LayoutWords = {
  ...DEFAULT_LAYOUT_WORDS,
  toolbar: 'Mise en page',
  align: 'Alignement',
  aligns: { start: 'Aligner a gauche', center: 'Centrer', end: 'Aligner a droite' },
  fullWidth: 'Pleine largeur',
};

const boxAttrs = z.object({
  width: z
    .union([z.number(), z.literal('full')])
    .nullable()
    .default(null),
  align: z.enum(['start', 'center', 'end']).nullable().default(null),
});

/** A block drawn as a media block's view draws its toolbar. */
function BoxView({ attrs, editor, getPos }: NodeViewProps<z.infer<typeof boxAttrs>>): ReactNode {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const set = (layout: Record<string, unknown>) => editor.run('setBlockLayout', { pos: getPos(), layout });
  return (
    <div ref={setAnchor} data-slot="box" {...layoutProps(attrs)} className="h-16">
      <BlockToolbar editor={editor} pos={getPos()} anchor={anchor} label={words.toolbar}>
        <AlignControl value={attrs.align} onChange={(align) => set({ align })} words={words} />
        <WidthToggle
          full={attrs.width === 'full'}
          onChange={(full) => set({ width: full ? 'full' : null })}
          words={words}
        />
      </BlockToolbar>
    </div>
  );
}

const box: EditorFeature = defineFeature({
  id: 'box',
  nodes: [{ name: 'box', group: 'block', atom: true, selectable: true, attrs: boxAttrs, render: BoxView }],
});

const content: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
    { type: 'box', attrs: { width: null, align: null } },
    { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
  ],
};

async function mount(doc: DocJSON = content, room = 'p-16'): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(
    <div className={`style-nova ${room}`}>
      <Editor
        features={[standardKit({ layout: { types: { box: ['align', 'width'] } } }), box]}
        content={doc}
        onReady={(e) => (ready = e)}
      />
    </div>,
  );
  return vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
}

const boxAttrsOf = (editor: IEditor) => editor.getJSON().content?.[1]?.attrs;
const text = () => document.querySelector<HTMLElement>('.ProseMirror') as HTMLElement;
const toolbar = () => page.getByRole('toolbar', { name: 'Mise en page' });

async function selectBox(): Promise<void> {
  await userEvent.click(page.getByTestId('box'));
  await expect.element(toolbar()).toBeVisible();
}

describe('BlockToolbar', () => {
  it('selecting a block opens the toolbar without moving focus', async () => {
    await mount();
    await expect.element(page.getByTestId('box')).toBeInTheDocument();
    await expect.element(toolbar()).not.toBeInTheDocument();

    await selectBox();

    expect(document.activeElement).toBe(text());
  });

  it('every control is reachable by the keyboard and named from words', async () => {
    await mount();
    await selectBox();

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('button', { name: 'Aligner a gauche' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(page.getByRole('button', { name: 'Centrer' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(page.getByRole('button', { name: 'Aligner a droite' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(page.getByRole('button', { name: 'Pleine largeur' })).toHaveFocus();
    await expect.element(page.getByRole('group', { name: 'Alignement' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.activeElement).toBe(text()));
    await expect.element(toolbar()).toBeVisible();
  });

  it('sets the alignment and the full width through the block layout, and hides once the caret leaves', async () => {
    const editor = await mount();
    await selectBox();

    await userEvent.click(page.getByRole('button', { name: 'Centrer' }));
    await vi.waitFor(() => expect(boxAttrsOf(editor)?.align).toBe('center'));
    await userEvent.click(page.getByRole('button', { name: 'Pleine largeur' }));
    await vi.waitFor(() => expect(boxAttrsOf(editor)?.width).toBe('full'));
    await expect.element(page.getByRole('button', { name: 'Pleine largeur' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(page.getByText('After'));
    await expect.element(toolbar()).not.toBeInTheDocument();
  });

  it('stays out of the way of a block dragged by its grip, and opens again on the dropped block', async () => {
    await page.viewport(900, 700);
    // No room above the box, so its toolbar would open below it, over the line it is dropped on.
    const editor = await mount(
      {
        type: 'doc',
        content: [
          { type: 'box', attrs: { width: null, align: null } },
          { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
        ],
      },
      'px-16',
    );
    const target = page.getByText('After');
    await userEvent.hover(page.getByTestId('box'), { position: { x: 4, y: 4 } });
    const grip = page.getByRole('button', { name: 'Block handle' });
    await expect.element(grip).toBeVisible();
    // Past the line's text, under the middle of the box, where its toolbar opens below it.
    const line = target.element().getBoundingClientRect();

    await userEvent.dragAndDrop(grip, target.element(), {
      targetPosition: { x: line.width / 2, y: line.height - 2 },
      steps: 10,
    });

    await vi.waitFor(() =>
      expect(
        editor
          .getJSON()
          .content?.map((node) => node.type)
          .slice(0, 2),
      ).toEqual(['paragraph', 'box']),
    );
    await expect.element(toolbar()).toBeVisible();
  });

  it('draws nothing in a read-only editor, the block selected', async () => {
    const editor = await mount();
    editor.setEditable(false);
    await userEvent.click(page.getByTestId('box'));
    await vi.waitFor(() => expect(editor.getSelection()).toMatchObject({ isNode: true }));
    await expect.element(toolbar()).not.toBeInTheDocument();
  });
});
