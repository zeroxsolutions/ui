import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { definePreset, type BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { DocJSON, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { Editor } from '../../react/editor';
import { standardKit } from '../standard/index';
import { presetsFeature } from './presets-feature';
import { EditorPresetsPanel, type PresetsMessages } from './presets-panel';

const text = (value: string): NodeJSON[] => [{ type: 'text', text: value }];
const line = (value: string): NodeJSON => ({ type: 'paragraph', content: text(value) });

const intro = definePreset({
  id: 'intro',
  label: 'Title and text',
  description: 'A heading over a line of text',
  keywords: ['opening'],
  content: [{ type: 'heading', attrs: { level: 2 }, content: text('Title') }, line('Body')],
});
// The standard kit holds no callout, so the panel never lists this one.
const note = definePreset({
  id: 'note',
  label: 'Note',
  content: [{ type: 'callout', attrs: { variant: 'info' }, content: [{ type: 'paragraph' }] }],
});
const divided = (at: number): BlockPreset =>
  definePreset({
    id: `divided-${at}`,
    label: `Divided ${at}`,
    content: [line(`Part ${at}`), { type: 'horizontalRule' }],
  });

const twoLines: DocJSON = { type: 'doc', content: [line('First'), line('Second')] };

interface HostProps {
  presets: readonly BlockPreset[];
  editable?: boolean;
  messages?: Partial<PresetsMessages>;
  onReady(editor: IEditor): void;
}

function Host({ presets, editable = true, messages, onReady }: HostProps) {
  const [features] = useState(() => [standardKit(), presetsFeature(presets)]);
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className="style-nova flex flex-col gap-6 p-12">
      <div>
        <Editor
          features={features}
          content={twoLines}
          editable={editable}
          onReady={(ready) => {
            setEditor(ready);
            onReady(ready);
          }}
        />
      </div>
      {editor && <EditorPresetsPanel editor={editor} presets={presets} messages={messages} className="w-72" />}
    </div>
  );
}

async function mount(props: Omit<HostProps, 'onReady'>): Promise<IEditor> {
  let mounted: IEditor | null = null;
  await render(<Host {...props} onReady={(editor) => (mounted = editor)} />);
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

const summary = (editor: IEditor) =>
  (editor.getJSON().content ?? []).map(
    (node) => `${node.type}:${(node.content ?? []).map((child) => child.text ?? '').join('')}`,
  );

const rows = () => page.getByRole('list', { name: 'Presets' }).getByRole('button');

describe('EditorPresetsPanel', () => {
  it('lists the presets the editor can hold, each with its line', async () => {
    await mount({ presets: [intro, note] });

    await expect.element(page.getByRole('button', { name: /Title and text/ })).toBeVisible();
    await expect.element(page.getByText('A heading over a line of text')).toBeVisible();
    expect(rows().elements()).toHaveLength(1);
  });

  it('inserts the preset clicked after the block holding the caret', async () => {
    const editor = await mount({ presets: [intro] });
    await userEvent.click(await lineHolding('First'));

    await userEvent.click(page.getByRole('button', { name: /Title and text/ }));

    await vi.waitFor(() =>
      expect(summary(editor)).toEqual(['paragraph:First', 'heading:Title', 'paragraph:Body', 'paragraph:Second']),
    );
  });

  it('inserts the preset dragged onto the editor where it is dropped', async () => {
    const editor = await mount({ presets: [intro] });

    await userEvent.dragAndDrop(page.getByRole('button', { name: /Title and text/ }), await lineHolding('Second'), {
      steps: 10,
      targetPosition: { x: 2, y: 4 },
    });

    await vi.waitFor(() =>
      expect(summary(editor)).toEqual(['paragraph:First', 'heading:Title', 'paragraph:Body', 'paragraph:Second']),
    );
  });

  it('offers a search over more than six presets, by label and by keyword', async () => {
    await mount({ presets: [intro, ...[1, 2, 3, 4, 5, 6].map(divided)] });
    const search = page.getByRole('searchbox', { name: 'Search presets' });
    await expect.element(search).toBeVisible();
    expect(rows().elements()).toHaveLength(7);

    await userEvent.fill(search, 'opening');
    await vi.waitFor(() => expect(rows().elements()).toHaveLength(1));
    await expect.element(page.getByRole('button', { name: /Title and text/ })).toBeVisible();

    await userEvent.fill(search, 'divided 3');
    await vi.waitFor(() =>
      expect(
        rows()
          .elements()
          .map((row) => row.textContent),
      ).toEqual(['Divided 3']),
    );
  });

  it('offers no search over six presets or fewer', async () => {
    await mount({ presets: [1, 2, 3, 4, 5, 6].map(divided) });

    await vi.waitFor(() => expect(rows().elements()).toHaveLength(6));
    expect(page.getByRole('searchbox').elements()).toHaveLength(0);
  });

  it('says so in the host words when no preset fits', async () => {
    await mount({ presets: [intro], editable: false, messages: { title: 'Blocks', empty: 'Nothing to add here' } });

    await expect.element(page.getByText('Nothing to add here')).toBeVisible();
    await expect.element(page.getByRole('region', { name: 'Blocks' })).toBeVisible();
    expect(page.getByRole('button', { name: /Title and text/ }).elements()).toHaveLength(0);
  });
});
