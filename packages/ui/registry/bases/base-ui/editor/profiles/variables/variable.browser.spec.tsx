import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { emailNodeSpecs, type VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { TriggerLayer } from '../../composer/triggers/trigger-layer';
import { Editor } from '../../document/react/editor';
import { standardKit } from '../../document/features/standard/index';
import { refreshVariables, variableFeature } from './variable';
import { VariableMenu } from './variable-menu';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'resetUrl', type: 'url', label: 'Reset link' },
  { name: 'expiresIn', type: 'duration' },
  { name: 'supportEmail', type: 'email', label: 'Support email' },
];

// A text-only block, as the email profile's code is.
const emailCode: EditorFeature = {
  id: 'email-code',
  nodes: emailNodeSpecs.nodes.filter((node) => node.name === 'emailCode'),
};

function VariableEditor({
  content,
  declarations,
  onReady,
}: {
  content?: DocJSON;
  declarations: VariableDeclaration[];
  onReady(editor: IEditor): void;
}) {
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [variables] = useState(() => variableFeature(() => declarations));
  return (
    <div className="style-nova">
      {editor && <VariableMenu editor={editor} declarations={declarations} />}
      <Editor
        features={[standardKit(), emailCode, variables.feature]}
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

async function mount(content?: DocJSON, declarations: VariableDeclaration[] = declared): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(<VariableEditor content={content} declarations={declarations} onReady={(editor) => (ready = editor)} />);
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

function paragraph(...content: NodeJSON[]): DocJSON {
  return { type: 'doc', content: [{ type: 'paragraph', content }] };
}

const text = (value: string): NodeJSON => ({ type: 'text', text: value });
const variable = (name: string): NodeJSON => ({ type: 'variable', attrs: { name } });

const chips = () => [...document.querySelectorAll<HTMLElement>('[data-slot=variable]')];

/** Put `value` on the clipboard the way a reader does: select it in a field and copy. */
async function copyText(value: string): Promise<void> {
  const source = document.createElement('textarea');
  source.value = value;
  document.body.append(source);
  await userEvent.click(source);
  await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
  await userEvent.copy();
  source.remove();
}

async function openMenu(): Promise<Element> {
  return vi.waitFor(() => {
    const found = document.querySelector('[data-slot=trigger-menu][data-token-kind=variable]');
    if (!found?.querySelector('[data-slot=item]')) throw new Error('the menu is not open');
    return found;
  });
}

const titles = (menu: Element) =>
  [...menu.querySelectorAll('[data-slot=item-title]')].map((title) => title.textContent);

describe('a variable', () => {
  it('opens on {{, filters to what follows, and inserts the chosen one as a chip reading its label', async () => {
    const editor = await mount();
    await userEvent.click(surface());
    // `{{` is userEvent's escape for one literal `{`.
    await userEvent.keyboard('Hi {{{{na');

    expect(titles(await openMenu())).toEqual(['Name']);

    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(chips().map((chip) => chip.textContent)).toEqual(['Name']));
    expect(inline(editor)).toEqual([text('Hi '), variable('name')]);
  });

  it('opens on {{ right after a word', async () => {
    await mount();
    await userEvent.click(surface());
    await userEvent.keyboard('Code:{{{{na');

    expect(titles(await openMenu())).toEqual(['Name']);
  });

  it('turns a typed {{name}} into a chip', async () => {
    const editor = await mount();
    await userEvent.click(surface());
    await userEvent.keyboard('({{{{name}})');

    await vi.waitFor(() => expect(inline(editor)).toEqual([text('('), variable('name'), text(')')]));
  });

  it('inserts the one picked from the toolbar menu at the caret, found by its label or its name', async () => {
    const editor = await mount(paragraph(text('Open  now')));
    await userEvent.click(surface());
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');

    await userEvent.click(document.querySelector('[data-slot=variable-menu]')!);
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('Find a variable'));
    await userEvent.keyboard('supportEmail');
    const option = await vi.waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('[data-slot=combobox-item]')];
      expect(found.map((item) => item.textContent)).toEqual(['Support email']);
      return found[0];
    });
    await userEvent.click(option);

    await vi.waitFor(() => expect(inline(editor)).toEqual([text('Open '), variable('supportEmail'), text(' now')]));
  });

  it('reads each pasted {{name}} as a chip and marks the one no declaration names', async () => {
    const editor = await mount();
    await copyText('Hi {{name}} {{ghost}}');

    await userEvent.click(surface());
    await userEvent.paste();

    await vi.waitFor(() =>
      expect(inline(editor)).toEqual([text('Hi '), variable('name'), text(' '), variable('ghost')]),
    );
    await vi.waitFor(() => expect(chips()).toHaveLength(2));
    const [known, ghost] = chips();
    expect([known.textContent, known.getAttribute('data-problem'), known.getAttribute('aria-invalid')]).toEqual([
      'Name',
      null,
      null,
    ]);
    expect(known.querySelector('svg[aria-hidden]')).not.toBeNull();
    expect([ghost.textContent, ghost.getAttribute('data-problem'), ghost.getAttribute('aria-invalid')]).toEqual([
      'ghost',
      'variable-undeclared',
      'true',
    ]);
    expect(ghost.querySelector('svg')).toBeNull();
  });

  it('keeps a pasted {{name}} as text in a block that holds text only', async () => {
    const editor = await mount({
      type: 'doc',
      content: [{ type: 'emailCode', content: [text('ab')] }],
    });
    await copyText('{{code}}');

    await userEvent.click(document.querySelector('[data-type=emailCode]')!);
    await userEvent.keyboard('{End}{ArrowLeft}');
    await userEvent.paste();

    // The empty paragraph after it is the trailing line the standard kit keeps below a last block.
    await vi.waitFor(() =>
      expect(editor.getJSON().content).toEqual([
        expect.objectContaining({ type: 'emailCode', content: [text('a{{code}}b')] }),
        { type: 'paragraph' },
      ]),
    );
  });

  it('reads its declaration again once the host says the declarations changed', async () => {
    const declarations = [...declared];
    const editor = await mount(paragraph(text('Go '), variable('later')), declarations);
    await vi.waitFor(() => expect(chips()[0]?.getAttribute('data-problem')).toBe('variable-undeclared'));

    declarations.push({ name: 'later', type: 'url', label: 'Later link' });
    expect(refreshVariables(editor)).toBe(true);

    await vi.waitFor(() => expect(chips()[0]?.getAttribute('data-problem')).toBeNull());
    expect(chips()[0]?.textContent).toBe('Later link');
  });

  it('deletes the whole chip on one Backspace after it', async () => {
    const editor = await mount(paragraph(text('Hi '), variable('name')));
    await userEvent.click(surface());
    await userEvent.keyboard('{End}{Backspace}');

    await vi.waitFor(() => expect(inline(editor)).toEqual([text('Hi ')]));
  });

  it('copies as its {{name}} token in plain text', async () => {
    await mount(paragraph(text('Hi '), variable('name')));
    await userEvent.click(surface());
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
    await userEvent.copy();

    const target = document.createElement('textarea');
    document.body.append(target);
    await userEvent.click(target);
    await userEvent.paste();

    expect(target.value).toBe('Hi {{name}}');
    target.remove();
  });

  // The chip is a Badge, whose own text is a label's size; in a document it is a word of its line.
  it('reads at the size of the text around it', async () => {
    await mount(paragraph(text('Hi '), variable('name')));
    await vi.waitFor(() => expect(chips()).toHaveLength(1));
    const chip = chips()[0];
    expect(chip.classList).toContain('cn-badge');
    expect(getComputedStyle(chip).fontSize).toBe(getComputedStyle(chip.closest('p')!).fontSize);
  });
});
