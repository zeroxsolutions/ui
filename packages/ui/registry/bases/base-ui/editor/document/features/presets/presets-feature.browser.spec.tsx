import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { definePreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { DocJSON, EditorFeature, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import { blockIdentity } from '@zeroxsolutions/editor-core/profiles/editor/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { Editor } from '../../react/editor';
import { SlashMenu } from '../../ui/slash-menu';
import { callout } from '../callout/index';
import { standardKit } from '../standard/index';
import { presetsFeature, startPresetDrag } from './presets-feature';

const text = (value: string): NodeJSON[] => [{ type: 'text', text: value }];
const line = (value: string): NodeJSON => ({ type: 'paragraph', content: text(value) });

const intro = definePreset({
  id: 'intro',
  label: 'Title and text',
  description: 'A heading over a line of text',
  keywords: ['opening'],
  content: [
    { type: 'heading', attrs: { level: 2, id: 'srv-1', key: 'kept' }, content: text('Title') },
    { type: 'paragraph', attrs: { id: 'srv-2' }, content: text('Body') },
  ],
});
// The standard kit holds no callout, so this one fits no editor below.
const note = definePreset({
  id: 'note',
  label: 'Note',
  content: [{ type: 'callout', attrs: { variant: 'info' }, content: [{ type: 'paragraph' }] }],
});

const features: EditorFeature[] = [standardKit(), blockIdentity(), presetsFeature([intro, note])];
const twoLines: DocJSON = { type: 'doc', content: [line('First'), line('Second')] };

function Host({
  editable,
  features,
  content,
  onReady,
  children,
}: {
  editable: boolean;
  features: EditorFeature[];
  content: DocJSON;
  onReady(editor: IEditor): void;
  children?: ReactNode;
}) {
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className="style-nova p-12">
      {children}
      <Editor
        features={features}
        content={content}
        editable={editable}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <SlashMenu editor={editor} items={collectUiContributions(features).slash} />}
    </div>
  );
}

async function mount(
  options: { editable?: boolean; children?: ReactNode; features?: EditorFeature[]; content?: DocJSON } = {},
): Promise<IEditor> {
  let mounted: IEditor | null = null;
  await render(
    <Host
      editable={options.editable ?? true}
      features={options.features ?? features}
      content={options.content ?? twoLines}
      onReady={(editor) => (mounted = editor)}
    >
      {options.children}
    </Host>,
  );
  return vi.waitFor(() => {
    if (!mounted) throw new Error('the editor is not ready');
    return mounted;
  });
}

async function lineHolding(value: string): Promise<HTMLElement> {
  return vi.waitFor(() => {
    const found = [...document.querySelectorAll<HTMLElement>('.ProseMirror > p')].find((p) => p.textContent === value);
    if (!found) throw new Error(`no line holds ${value}`);
    return found;
  });
}

const blocks = (editor: IEditor) => editor.getJSON().content ?? [];
const summary = (editor: IEditor) =>
  blocks(editor).map((node) => `${node.type}:${(node.content ?? []).map((child) => child.text ?? '').join('')}`);

describe('insertPreset', () => {
  it('inserts the preset after the block holding the caret, and leaves the caret at its end', async () => {
    const editor = await mount();
    await userEvent.click(await lineHolding('First'));

    expect(editor.run('insertPreset', { id: 'intro' })).toBe(true);

    expect(summary(editor)).toEqual(['paragraph:First', 'heading:Title', 'paragraph:Body', 'paragraph:Second']);
    const body = blocks(editor)[2];
    expect(editor.getSelection()).toMatchObject({ empty: true, nodeType: body.type });
    expect(editor.getSelection().from).toBe(1 + 'First'.length + 1 + 1 + 'Title'.length + 1 + 1 + 'Body'.length);
  });

  it('inserts the same preset twice as two copies, every block with a key of its own and no id', async () => {
    const editor = await mount();
    await userEvent.click(await lineHolding('First'));

    editor.run('insertPreset', { id: 'intro' });
    editor.run('insertPreset', { id: 'intro' });

    const inserted = blocks(editor).filter((node) => node.type === 'heading' || node.content?.[0]?.text === 'Body');
    expect(inserted).toHaveLength(4);
    expect(inserted.map((node) => node.attrs?.id)).toEqual([null, null, null, null]);
    const keys = new Set(inserted.map((node) => node.attrs?.key));
    expect(keys.size).toBe(4);
    expect(keys.has('kept')).toBe(false);
  });

  it('is undone in one step, back to the document it was inserted into', async () => {
    const editor = await mount();
    await userEvent.click(await lineHolding('First'));
    const before = editor.getJSON();

    editor.run('insertPreset', { id: 'intro' });
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');

    await vi.waitFor(() => expect(editor.getJSON()).toEqual(before));
  });

  it('inserts at a block boundary it is given', async () => {
    const editor = await mount();

    expect(editor.run('insertPreset', { id: 'intro', at: 0 })).toBe(true);

    expect(summary(editor)).toEqual(['heading:Title', 'paragraph:Body', 'paragraph:First', 'paragraph:Second']);
  });

  it('cannot insert an unknown preset, one holding a block the editor lacks, or inside a line', async () => {
    const editor = await mount();
    await userEvent.click(await lineHolding('First'));

    expect(editor.can('insertPreset', { id: 'intro' })).toBe(true);
    expect(editor.can('insertPreset', { id: 'missing' })).toBe(false);
    expect(editor.can('insertPreset', { id: 'note' })).toBe(false);
    expect(editor.can('insertPreset', { id: 'intro', at: 2 })).toBe(false);
  });

  it('cannot insert into an editor that is not editable', async () => {
    const editor = await mount({ editable: false });

    expect(editor.can('insertPreset', { id: 'intro', at: 0 })).toBe(false);
    expect(editor.run('insertPreset', { id: 'intro', at: 0 })).toBe(false);
    expect(summary(editor)).toEqual(['paragraph:First', 'paragraph:Second']);
  });
});

describe('the presets in the slash menu', () => {
  it('lists the presets the editor can hold under Presets, and puts the one picked in place of the new line', async () => {
    const editor = await mount();
    await userEvent.click(await lineHolding('Second'));
    await userEvent.keyboard('{End}{Enter}/');

    await expect.element(page.getByText('Presets', { exact: true })).toBeVisible();
    await expect.element(page.getByText('Title and text')).toBeVisible();
    expect(page.getByText('Note', { exact: true }).elements()).toHaveLength(0);

    await userEvent.keyboard('opening');
    await userEvent.click(page.getByText('Title and text'));

    await vi.waitFor(() =>
      expect(summary(editor)).toEqual(['paragraph:First', 'paragraph:Second', 'heading:Title', 'paragraph:Body']),
    );
  });
});

describe('a preset dragged onto the editor', () => {
  it('is inserted at the block boundary it is dropped on', async () => {
    const editor = await mount({
      children: (
        <div draggable data-testid="source" onDragStart={(event) => startPresetDrag(event.dataTransfer, 'intro')}>
          Title and text
        </div>
      ),
    });

    await userEvent.dragAndDrop(page.getByTestId('source'), await lineHolding('Second'), {
      steps: 10,
      targetPosition: { x: 2, y: 4 },
    });

    await vi.waitFor(() =>
      expect(summary(editor)).toEqual(['paragraph:First', 'heading:Title', 'paragraph:Body', 'paragraph:Second']),
    );
  });

  it('inserts nothing for a preset the editor cannot hold', async () => {
    const editor = await mount({
      children: (
        <div draggable data-testid="source" onDragStart={(event) => startPresetDrag(event.dataTransfer, 'note')}>
          Note
        </div>
      ),
    });

    await userEvent.dragAndDrop(page.getByTestId('source'), await lineHolding('Second'), {
      steps: 10,
      targetPosition: { x: 2, y: 4 },
    });

    expect(summary(editor)).toEqual(['paragraph:First', 'paragraph:Second']);
  });

  it('lands after a callout it is dropped over, not inside it', async () => {
    const editor = await mount({
      features: [standardKit(), callout(), blockIdentity(), presetsFeature([intro])],
      content: {
        type: 'doc',
        content: [
          line('First'),
          { type: 'callout', attrs: { variant: 'info' }, content: [line('Inside')] },
          line('Last'),
        ],
      },
      children: (
        <div draggable data-testid="source" onDragStart={(event) => startPresetDrag(event.dataTransfer, 'intro')}>
          Title and text
        </div>
      ),
    });
    const inside = await vi.waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('.ProseMirror [data-slot=callout] p')].find(
        (p) => p.textContent === 'Inside',
      );
      if (!found) throw new Error('no line in the callout holds Inside');
      return found;
    });

    await userEvent.dragAndDrop(page.getByTestId('source'), inside, {
      steps: 10,
      targetPosition: { x: 2, y: inside.getBoundingClientRect().height - 2 },
    });

    await vi.waitFor(() =>
      expect(summary(editor)).toEqual([
        'paragraph:First',
        'callout:',
        'heading:Title',
        'paragraph:Body',
        'paragraph:Last',
      ]),
    );
    expect(blocks(editor)[1].content?.map((node) => node.type)).toEqual(['paragraph']);
  });
});

describe('the drop cursor of a preset dragged over the editor', () => {
  const dragged = (type: 'dragover' | 'dragleave', at: { x: number; y: number }) => {
    const data = new DataTransfer();
    startPresetDrag(data, 'intro');
    return new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: at.x,
      clientY: at.y,
      dataTransfer: data,
      relatedTarget: null,
    });
  };
  const cursor = () => document.querySelector('.prosemirror-dropcursor-block');

  // Safari leaves relatedTarget null on a dragleave between two elements inside the editor; Chromium never does, so
  // the event is built here.
  it('stays through a dragleave with no related target at a point inside the editor', async () => {
    await mount();
    const second = await lineHolding('Second');
    const { left, top } = second.getBoundingClientRect();
    const point = { x: left + 2, y: top + 4 };

    second.dispatchEvent(dragged('dragover', point));
    await vi.waitFor(() => expect(cursor()).not.toBeNull());
    second.dispatchEvent(dragged('dragleave', point));

    expect(cursor()).not.toBeNull();
  });

  it('goes once a dragleave with no related target is outside the editor', async () => {
    await mount();
    const second = await lineHolding('Second');
    const { left, top } = second.getBoundingClientRect();

    second.dispatchEvent(dragged('dragover', { x: left + 2, y: top + 4 }));
    await vi.waitFor(() => expect(cursor()).not.toBeNull());
    second.dispatchEvent(dragged('dragleave', { x: 0, y: 0 }));

    await vi.waitFor(() => expect(cursor()).toBeNull());
  });
});
