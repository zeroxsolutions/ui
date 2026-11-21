import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { DocJSON, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { TriggerLayer } from '../../composer/triggers/trigger-layer';
import { Editor } from '../../document/react/editor';
import { standardKit } from '../../document/features/standard/index';
import { variableFeature } from './variable';
import { VariableMenu } from './variable-menu';

const declarations: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'resetUrl', type: 'url', label: 'Reset link' },
  { name: 'expiresIn', type: 'duration' },
  { name: 'supportEmail', type: 'email', label: 'Support email' },
];

function VariableEditor({ content, onReady }: { content?: DocJSON; onReady(editor: IEditor): void }) {
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [variables] = useState(() => variableFeature(() => declarations));
  return (
    <div className="style-nova">
      {editor && <VariableMenu editor={editor} declarations={declarations} />}
      <Editor
        features={[standardKit(), variables.feature]}
        content={content}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <TriggerLayer editor={editor} triggers={[variables.token]} />}
    </div>
  );
}

async function mount(content?: DocJSON): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(<VariableEditor content={content} onReady={(editor) => (ready = editor)} />);
  return vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
}

function surface(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[contenteditable=true]');
  if (!found) throw new Error('the editor has no editable surface');
  return found;
}

function inline(editor: IEditor): NodeJSON[] {
  return editor.getJSON().content?.flatMap((block) => block.content ?? []) ?? [];
}

const chips = () => [...document.querySelectorAll<HTMLElement>('[data-slot=variable]')];

describe('a variable', () => {
  it('opens on {{, filters to what follows, and inserts the chosen one as a chip reading its label', async () => {
    const editor = await mount();
    await userEvent.click(surface());
    // `{{` is userEvent's escape for one literal `{`.
    await userEvent.keyboard('Hi {{{{na');

    const menu = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=trigger-menu][data-token-kind=variable]');
      if (!found?.querySelector('[data-slot=item]')) throw new Error('the menu is not open');
      return found;
    });
    expect([...menu.querySelectorAll('[data-slot=item-title]')].map((title) => title.textContent)).toEqual(['Name']);

    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(chips().map((chip) => chip.textContent)).toEqual(['Name']));
    expect(inline(editor)).toEqual([
      { type: 'text', text: 'Hi ' },
      { type: 'variable', attrs: { name: 'name' } },
    ]);
  });

  it('inserts the one picked from the toolbar menu at the caret', async () => {
    const editor = await mount({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Open  now' }] }],
    });
    await userEvent.click(surface());
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');

    await userEvent.click(document.querySelector('[data-slot=variable-menu]')!);
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Find a variable'));
    await userEvent.keyboard('reset');
    const option = await vi.waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('[data-slot=combobox-item]')];
      expect(found.map((item) => item.textContent)).toEqual(['Reset link']);
      return found[0];
    });
    await userEvent.click(option);

    await vi.waitFor(() =>
      expect(inline(editor)).toEqual([
        { type: 'text', text: 'Open ' },
        { type: 'variable', attrs: { name: 'resetUrl' } },
        { type: 'text', text: ' now' },
      ]),
    );
  });

  it('reads each pasted {{name}} as a chip and marks the one no declaration names', async () => {
    const editor = await mount();
    const source = document.createElement('textarea');
    source.value = 'Hi {{name}} {{ghost}}';
    document.body.append(source);
    await userEvent.click(source);
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await userEvent.copy();
    source.remove();

    await userEvent.click(surface());
    await userEvent.paste();

    await vi.waitFor(() =>
      expect(inline(editor)).toEqual([
        { type: 'text', text: 'Hi ' },
        { type: 'variable', attrs: { name: 'name' } },
        { type: 'text', text: ' ' },
        { type: 'variable', attrs: { name: 'ghost' } },
      ]),
    );
    await vi.waitFor(() => expect(chips()).toHaveLength(2));
    expect(chips().map((chip) => [chip.textContent, chip.getAttribute('data-problem')])).toEqual([
      ['Name', null],
      ['ghost', 'variable-undeclared'],
    ]);
  });

  // The chip is a Badge, whose own text is a label's size; in a document it is a word of its line.
  it('reads at the size of the text around it', async () => {
    await mount({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hi ' },
            { type: 'variable', attrs: { name: 'name' } },
          ],
        },
      ],
    });
    await vi.waitFor(() => expect(chips()).toHaveLength(1));
    const chip = chips()[0];
    expect(chip.classList).toContain('cn-badge');
    expect(getComputedStyle(chip).fontSize).toBe(getComputedStyle(chip.closest('p')!).fontSize);
  });
});
