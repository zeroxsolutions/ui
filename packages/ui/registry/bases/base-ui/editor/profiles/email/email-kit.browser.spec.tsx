import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { EditorFeature, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import {
  emailProfile,
  fromEmailBlocks,
  MAIL_LAYOUT_KINDS,
  toEmailBlocks,
  type EditorEmailBlock,
  type EditorProfile,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { standardKit } from '../../document/features/standard/index';
import { Editor } from '../../document/react/editor';
import { BubbleMenu } from '../../document/ui/bubble-menu';
import { EditorToolbar } from '../../document/ui/editor-toolbar';
import { SlashMenu } from '../../document/ui/slash-menu';
import { emailKit, emailUi, type EmailKitOptions } from './email-kit';
import { LinkVariablePicker } from './url-variable-picker';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'resetUrl', type: 'url', label: 'Reset link' },
  { name: 'expiresIn', type: 'duration' },
  { name: 'helpUrl', type: 'url', label: 'Help page' },
  { name: 'supportEmail', type: 'email', label: 'Support email' },
];

const fullProfile = emailProfile({ variables: declared });

function block(overrides: Partial<EditorEmailBlock> & Pick<EditorEmailBlock, 'type'>): EditorEmailBlock {
  return { id: null, key: '', attributes: {}, content: {}, ...overrides };
}

const paragraph = (text: string, id: string | null = null) =>
  block({ id, key: id ?? '', type: 'paragraph', content: { text } });

const textOf = (node: NodeJSON) => (node.content ?? []).map((child) => child.text ?? '').join('');

/** A custom block with an email codec, as a host's own feature adds one. */
const note: EditorFeature = {
  id: 'note',
  nodes: [{ name: 'note', group: 'block', content: 'inline*' }],
  codecs: [
    {
      node: 'note',
      toEmailBlock: (node) => ({
        id: typeof node.attrs?.id === 'string' ? node.attrs.id : null,
        key: String(node.attrs?.key ?? ''),
        type: 'note',
        attributes: {},
        content: { text: textOf(node) },
      }),
      fromEmailBlock: (stored) =>
        stored.type === 'note'
          ? {
              type: 'note',
              attrs: { id: stored.id, key: stored.key },
              content: [{ type: 'text', text: String(stored.content.text) }],
            }
          : null,
    },
  ],
};
const codecs = note.codecs ?? [];

function EmailHarness({
  profile,
  blocks,
  extra,
  options,
  onReady,
}: {
  profile: EditorProfile;
  blocks: EditorEmailBlock[];
  extra: EditorFeature[];
  options?: EmailKitOptions;
  onReady(editor: IEditor): void;
}) {
  const [features] = useState(() => emailKit(profile, extra, options));
  const [ui] = useState(() => emailUi(collectUiContributions(features), profile));
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setRoot} className="style-nova p-12">
      <Editor
        features={features}
        content={fromEmailBlocks(blocks, codecs)}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {/* Below the text, so the bubble over a selection never covers them. */}
      {editor && <EditorToolbar editor={editor} items={ui.toolbar} />}
      {editor && <LinkVariablePicker editor={editor} declarations={declared} />}
      {editor && <SlashMenu editor={editor} items={ui.slash} />}
      {editor && <BubbleMenu editor={editor} items={ui.bubble} container={root} />}
    </div>
  );
}

async function mount(
  blocks: EditorEmailBlock[],
  {
    profile = fullProfile,
    options,
    extra = [],
  }: { profile?: EditorProfile; options?: EmailKitOptions; extra?: EditorFeature[] } = {},
): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(
    <EmailHarness profile={profile} blocks={blocks} extra={extra} options={options} onReady={(e) => (ready = e)} />,
  );
  return vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
}

const exported = (editor: IEditor) => toEmailBlocks(editor.getJSON(), codecs);

/** Pastes `html` at the caret, as the clipboard of another editor carries it. */
function pasteHtml(html: string): void {
  const data = new DataTransfer();
  data.setData('text/html', html);
  (document.activeElement ?? find('[contenteditable=true]')).dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
  );
}

const buttonHtml = '<div data-type="emailButton" label="Go" href="{{resetUrl}}"></div>';
const typesOf = (editor: IEditor) => (editor.getJSON().content ?? []).map((node) => node.type);

function find(selector: string, text?: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => text === undefined || element.textContent?.includes(text),
  );
  if (!found) throw new Error(`nothing matches ${selector}${text ? ` holding "${text}"` : ''}`);
  return found;
}

/** Puts the caret at the end of the paragraph holding `text`. */
async function caretAfter(text: string): Promise<void> {
  const element = await vi.waitFor(() => find('[contenteditable=true] p', text));
  await userEvent.click(element);
  await userEvent.keyboard('{End}');
}

/** Shows the grip of the block `selector` names, holding `text`, as a pointer over the block does. */
async function gripOf(selector: string, text?: string): Promise<HTMLElement> {
  await vi.waitFor(() => expect(document.querySelector('[role=menu]')).toBeNull());
  await userEvent.hover(await vi.waitFor(() => find(selector, text)));
  return vi.waitFor(() => {
    const grip = find('.drag-handle');
    if (grip.classList.contains('hide')) throw new Error('the grip is hidden');
    return grip;
  });
}

/** Opens the block menu from the grip of the paragraph holding `text`, or of the block `selector` names. */
async function openBlockMenu(text: string, selector = '[contenteditable=true] p'): Promise<void> {
  await userEvent.click(await gripOf(selector, text));
  await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();
}

async function chooseInBlockMenu(text: string, group: string, title: string, selector?: string): Promise<void> {
  await openBlockMenu(text, selector);
  await userEvent.click(page.getByRole('menuitem', { name: group }));
  await userEvent.click(page.getByRole('menuitemradio', { name: title, exact: true }));
}

async function pickOption(trigger: HTMLElement): Promise<HTMLElement[]> {
  await userEvent.click(trigger);
  return vi.waitFor(() => {
    const options = [...document.querySelectorAll<HTMLElement>('[data-slot=combobox-item]')];
    if (options.length === 0) throw new Error('the picker is not open');
    return options;
  });
}

const marksOf = (editor: IEditor): NodeJSON['marks'][] =>
  (editor.getJSON().content ?? []).flatMap((node) => (node.content ?? []).map((child) => child.marks));

/** The titles the slash menu lists once `/` is typed in an empty document. */
async function slashTitles(): Promise<(string | null)[]> {
  await userEvent.click(find('[contenteditable=true]'));
  await userEvent.keyboard('/');
  const menu = await vi.waitFor(() => find('[data-slot=slash-menu]'));
  return [...menu.querySelectorAll('[data-slot=item-title]')].map((title) => title.textContent);
}

describe('the email kit', () => {
  it("offers in the slash menu the email's kinds, the document's blocks among them", async () => {
    await mount([paragraph('')]);

    expect(await slashTitles()).toEqual([
      'Text',
      'Bulleted list',
      'Callout',
      'Code',
      'Divider',
      'Button',
      'Columns',
      'HTML',
    ]);
  });

  it('offers in the slash menu only the kinds a mail-layout region holds', async () => {
    await mount([paragraph('')], { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });

    expect(await slashTitles()).toEqual(['Text', 'Bulleted list', 'Callout', 'Divider', 'Columns']);
  });

  it("draws the document editor's grip and its insert button beside a block", async () => {
    await mount([paragraph('Hello')]);

    await gripOf('[contenteditable=true] p', 'Hello');

    expect(document.querySelector('[data-editor-add]')).not.toBeNull();
  });

  it("chooses a button's link in the block menu from the url variables only, read as it opens", async () => {
    const declarations = [...declared];
    const editor = await mount([block({ type: 'button', content: { label: 'Reset', href: '{{resetUrl}}' } })], {
      options: { declarations: () => declarations },
    });
    expect(document.querySelector('[data-slot=email-button] [data-slot=url-variable-picker]')).toBeNull();
    declarations.push({ name: 'laterUrl', type: 'url', label: 'Later link' });

    await openBlockMenu('', '[data-slot=email-button]');
    await userEvent.click(page.getByRole('menuitem', { name: 'Link' }));
    const choices = page.getByRole('menuitemradio');
    await expect.element(choices.nth(0)).toBeVisible();
    expect(choices.elements().map((choice) => choice.textContent)).toEqual(['Reset link', 'Help page', 'Later link']);
    await expect.element(page.getByRole('menuitemradio', { name: 'Reset link' })).toBeChecked();
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Help page' }));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ label: 'Reset', href: '{{helpUrl}}' }));
  });

  it('opens the block menu of a button whose label field holds the focus with Mod-/', async () => {
    const editor = await mount([
      paragraph('Before'),
      block({ type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
    ]);
    await caretAfter('Before');
    await userEvent.click(find('[aria-label="Button label"]'));
    await userEvent.keyboard('{ControlOrMeta>}/{/ControlOrMeta}');
    await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();

    await userEvent.click(page.getByRole('menuitem', { name: 'Width' }));
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Full width' }));

    await vi.waitFor(() => expect(exported(editor)[1].attributes).toEqual({ width: 'full' }));
    expect(exported(editor)[0].attributes).toEqual({});
  });
  it('links text to a url variable through the same picker', async () => {
    const editor = await mount([paragraph('Open the page')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    const picker = find('[data-slot=url-variable-picker][data-label=Link]');
    const options = await pickOption(picker);
    expect(options.map((option) => option.textContent)).toEqual(['Reset link', 'Help page']);
    await userEvent.click(options[0]);

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open the [page]({{resetUrl}})' }));
  });

  it('shows the link the caret is in, and removes it whole', async () => {
    const editor = await mount([paragraph('Open the [page]({{resetUrl}})')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');

    await vi.waitFor(() =>
      expect(find('[data-slot=url-variable-picker][data-label=Link]').getAttribute('aria-label')).toBe(
        'Link: Reset link',
      ),
    );
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    await userEvent.click(await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label="Remove link"]')));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open the page' }));
    expect(find('[data-slot=url-variable-picker][data-label=Link]').getAttribute('aria-label')).toBe('Link');
  });

  it('links a wider selection to the variable the picker already shows', async () => {
    const editor = await mount([paragraph('Open the [page]({{resetUrl}})')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Shift>}' + '{ArrowLeft}'.repeat(8) + '{/Shift}');

    const picker = find('[data-slot=url-variable-picker][data-label=Link]');
    await vi.waitFor(() => expect(picker.getAttribute('aria-label')).toBe('Link: Reset link'));
    const options = await pickOption(picker);
    await userEvent.click(options.find((option) => option.textContent === 'Reset link')!);

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open [the page]({{resetUrl}})' }));
  });

  it('toggles italic from the bubble menu', async () => {
    const editor = await mount([paragraph('Hello world')]);
    await caretAfter('Hello world');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    await userEvent.click(await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label=Italic]')));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Hello _world_' }));
  });

  it('toggles bold from the bubble menu and Mod-B, and italic from Mod-I', async () => {
    const editor = await mount([paragraph('Hello world')]);
    await caretAfter('Hello world');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    const bold = await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label=Bold]'));
    await userEvent.click(bold);
    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Hello **world**' }));

    await userEvent.keyboard('{ControlOrMeta>}i{/ControlOrMeta}');
    await vi.waitFor(() => expect(marksOf(editor)[1]).toEqual([{ type: 'bold' }, { type: 'italic' }]));

    await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}');
    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Hello _world_' }));
  });

  it('keeps marks off a code block and an html block', async () => {
    const blocks = [
      block({ id: 'c', key: 'c', type: 'code', content: { code: 'abc' } }),
      block({ id: 'h', key: 'h', type: 'html', content: { html: '<b>x</b>' } }),
    ];
    const editor = await mount(blocks);

    await userEvent.click(await vi.waitFor(() => find('[data-slot=email-html]')));
    await userEvent.keyboard('{End}{Shift>}{Home}{/Shift}');
    expect(editor.can('toggleBold')).toBe(false);
    await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}{ControlOrMeta>}i{/ControlOrMeta}');

    expect(exported(editor)).toEqual(blocks);
    expect(JSON.stringify(editor.getJSON())).not.toContain('"marks"');
  });

  it('turns no typed shortcut into a heading and keeps no underline', async () => {
    const editor = await mount([paragraph('Hello')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Enter}# Title');
    await userEvent.keyboard('{Shift>}{Home}{/Shift}{ControlOrMeta>}u{/ControlOrMeta}');

    await vi.waitFor(() =>
      expect(exported(editor)[1]).toMatchObject({ type: 'paragraph', content: { text: '# Title' } }),
    );
    expect(typesOf(editor)).toEqual(['paragraph', 'paragraph']);
    expect(JSON.stringify(editor.getJSON())).not.toContain('"marks"');
  });

  it('keeps a pasted `~~x~~` as the text it is', async () => {
    const editor = await mount([paragraph('Body')]);
    await caretAfter('Body');
    const data = new DataTransfer();
    data.setData('text/plain', ' ~~x~~');
    find('[contenteditable=true]').dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Body ~~x~~' }));
  });

  it('draws a callout with the align and the space after it stores', async () => {
    await mount([
      block({ type: 'callout', attributes: { align: 'center', spaceAfter: 'large' }, content: { text: 'Note' } }),
    ]);

    const text = await vi.waitFor(() => find('[contenteditable=true] p', 'Note'));
    const host = await vi.waitFor(() => {
      const found = text.closest<HTMLElement>('[data-align=center]');
      if (!found) throw new Error('the callout carries no align');
      return found;
    });
    expect(getComputedStyle(text).textAlign).toBe('center');
    expect(host.getAttribute('data-space-after')).toBe('large');
    expect(getComputedStyle(host).marginBottom).toBe('32px');
  });

  it('keeps the id and the align of a block turned into a list and back', async () => {
    const editor = await mount([
      block({ id: 'p', key: 'p', type: 'paragraph', attributes: { align: 'center' }, content: { text: 'Lines' } }),
    ]);

    await chooseInBlockMenu('Lines', 'Turn into', 'Bulleted list');
    await vi.waitFor(() =>
      expect(exported(editor)[0]).toMatchObject({ id: 'p', type: 'list', attributes: { align: 'center' } }),
    );
    await chooseInBlockMenu('Lines', 'Turn into', 'Text');

    await vi.waitFor(() =>
      expect(exported(editor)[0]).toMatchObject({ id: 'p', type: 'paragraph', attributes: { align: 'center' } }),
    );
  });

  it('keeps a pasted heading as a heading, which exports as its text', async () => {
    const editor = await mount([paragraph('Body')]);
    await caretAfter('Body');
    // Between two paragraphs, so the heading is pasted whole rather than joined to the line it lands in.
    pasteHtml('<p>Before</p><h1>Hi</h1><p>After</p>');

    await vi.waitFor(() => expect(typesOf(editor)).toContain('heading'));
    expect(exported(editor).map(({ type, content }) => [type, content])).toContainEqual(['paragraph', { text: 'Hi' }]);
  });
  it('sets align, space after and tone on a paragraph from the block menu', async () => {
    const editor = await mount([paragraph('Hi there', 'p')]);

    await chooseInBlockMenu('Hi there', 'Align', 'Center');
    await chooseInBlockMenu('Hi there', 'Space after', 'Large');
    await chooseInBlockMenu('Hi there', 'Tone', 'Muted');

    await vi.waitFor(() =>
      expect(exported(editor)[0].attributes).toEqual({ align: 'center', spaceAfter: 'large', tone: 'muted' }),
    );
    const shown = find('[contenteditable=true] p', 'Hi there');
    expect(getComputedStyle(shown).textAlign).toBe('center');
  });

  it("offers Align's three choices with the block's own checked", async () => {
    await mount([paragraph('Hi there', 'p')]);
    await openBlockMenu('Hi there');
    await userEvent.click(page.getByRole('menuitem', { name: 'Align' }));

    const choices = page.getByRole('menuitemradio');
    await expect.element(choices.nth(0)).toBeVisible();
    expect(choices.elements().map((choice) => choice.textContent)).toEqual(['Left', 'Center', 'Right']);
    await expect.element(page.getByRole('menuitemradio', { name: 'Left' })).toBeChecked();
  });
  it('sets the width of the button whose grip opened the menu, not of the block the caret is in', async () => {
    const editor = await mount([
      paragraph('Before'),
      block({ type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
    ]);
    await caretAfter('Before');

    await chooseInBlockMenu('', 'Width', 'Full width', '[data-slot=email-button]');

    await vi.waitFor(() => expect(exported(editor)[1].attributes).toEqual({ width: 'full' }));
    expect(exported(editor)[0].attributes).toEqual({});
  });
  it('moves the blocks of a removed lane into the last lane kept', async () => {
    const editor = await mount([
      block({
        id: 'cols',
        key: 'cols',
        type: 'columns',
        attributes: { ratio: [1, 1, 1] },
        lanes: [[paragraph('left', 'l')], [paragraph('middle', 'm')], [paragraph('right', 'r')]],
      }),
    ]);
    await chooseInBlockMenu('left', 'Lanes', '1 : 1');

    await vi.waitFor(() => expect(exported(editor)[0].lanes).toHaveLength(2));
    expect(exported(editor)[0].lanes?.map((lane) => lane.map(({ id, content }) => [id, content]))).toEqual([
      [['l', { text: 'left' }]],
      [
        ['m', { text: 'middle' }],
        ['r', { text: 'right' }],
      ],
    ]);
  });

  it("adds and removes a lane by the columns' ratio, keeping each block's id", async () => {
    const editor = await mount([
      block({
        id: 'cols',
        key: 'cols',
        type: 'columns',
        attributes: { ratio: [1, 1], spaceAfter: 'large' },
        lanes: [[paragraph('left', 'l')], [paragraph('right', 'r')]],
      }),
    ]);
    await chooseInBlockMenu('left', 'Lanes', '1 : 1 : 1');
    await vi.waitFor(() => expect(exported(editor)[0].lanes).toHaveLength(3));
    expect(exported(editor)[0].attributes).toEqual({ ratio: [1, 1, 1], spaceAfter: 'large' });

    await chooseInBlockMenu('left', 'Lanes', '2 : 1');
    await vi.waitFor(() => expect(exported(editor)[0].lanes).toHaveLength(2));
    const [columns] = exported(editor);
    expect(columns.attributes).toEqual({ ratio: [2, 1], spaceAfter: 'large' });
    expect(columns.lanes?.map((lane) => lane.map(({ id, content }) => [id, content]))).toEqual([
      [['l', { text: 'left' }]],
      [['r', { text: 'right' }]],
    ]);
  });

  it('keeps a columns block out of a lane', async () => {
    const editor = await mount([block({ type: 'columns', lanes: [[paragraph('left')], [paragraph('right')]] })]);
    await caretAfter('left');

    expect(editor.can('insertEmailBlock', { kind: 'columns' })).toBe(false);
    expect(editor.run('insertEmailBlock', { kind: 'columns' })).toBe(false);
    editor.run('insertContent', {
      content: { type: 'emailColumns', content: [{ type: 'emailLane', content: [{ type: 'paragraph' }] }] },
    });

    const lanes = editor.getJSON().content?.flatMap((node) => node.content ?? []) ?? [];
    expect(lanes.filter((lane) => lane.type === 'emailLane').length).toBeGreaterThan(0);
    for (const lane of lanes) {
      expect((lane.content ?? []).map((child) => child.type)).not.toContain('emailColumns');
    }
  });

  it("turns a text block into the email's text kinds only", async () => {
    await mount([paragraph('Lines')]);
    await openBlockMenu('Lines');
    await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));

    const choices = page.getByRole('menuitemradio');
    await expect.element(choices.nth(0)).toBeVisible();
    expect(choices.elements().map((choice) => choice.textContent)).toEqual(['Text', 'Bulleted list']);
  });

  it('offers no Turn into on a block whose kind is not text', async () => {
    await mount([
      block({ type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
      block({ type: 'code', content: { code: 'abc' } }),
      block({ type: 'html', content: { html: '<b>x</b>' } }),
      block({ type: 'divider' }),
      block({ type: 'columns', attributes: { ratio: [1, 1] }, lanes: [[], []] }),
    ]);

    for (const slot of ['email-button', 'code-card', 'email-html', 'divider', 'email-columns']) {
      const selector =
        slot === 'divider'
          ? '[contenteditable=true] hr'
          : slot === 'code-card'
            ? '[data-code-block]'
            : `[data-slot=${slot}]`;
      await openBlockMenu('', selector);
      expect(page.getByRole('menuitem', { name: 'Turn into' }).elements()).toEqual([]);
      await userEvent.keyboard('{Escape}');
    }
  });
  it('keys every block it holds, so an added block exports with a key', async () => {
    const editor = await mount([paragraph('Hi')]);
    await caretAfter('Hi');
    await userEvent.keyboard('{Enter}More');

    await vi.waitFor(() => expect(exported(editor)).toHaveLength(2));
    const added = exported(editor)[1];
    expect([added.id, added.key !== '']).toEqual([null, true]);
  });

  it('deletes a block from the block menu, and disables Delete with its reason on a required block', async () => {
    const editor = await mount([paragraph('Keep me', 'kept'), paragraph('Drop me', 'dropped')], {
      options: { required: () => ['kept'] },
    });
    await openBlockMenu('Keep me');
    const refused = page.getByRole('menuitem', { name: 'Delete' });
    await expect.element(refused).toBeDisabled();
    await userEvent.hover(refused, { force: true });
    await expect.element(page.getByText('This block is required')).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await openBlockMenu('Drop me');
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));

    await vi.waitFor(() => expect(exported(editor).map(({ id }) => id)).toEqual(['kept']));
  });
  it('changes no attribute and deletes no block in locked structure', async () => {
    const locked = 'The structure is locked: only text and variables change';
    await mount(
      [
        paragraph('Hi', 'p'),
        block({ id: 'b', key: 'b', type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
        block({
          id: 'c',
          key: 'c',
          type: 'columns',
          attributes: { ratio: [1, 1] },
          lanes: [[paragraph('left', 'l')], [paragraph('right', 'r')]],
        }),
      ],
      { options: { structure: () => 'locked' } },
    );
    const refusedIn = async (group: string, text: string, selector?: string) => {
      await openBlockMenu(text, selector);
      await userEvent.click(page.getByRole('menuitem', { name: group }));
      const choices = page.getByRole('menuitemradio');
      await expect.element(choices.nth(0)).toBeVisible();
      for (const choice of choices.elements()) expect(choice.hasAttribute('data-disabled')).toBe(true);
      await userEvent.keyboard('{Escape}{Escape}');
    };

    for (const group of ['Turn into', 'Align', 'Space after', 'Tone']) await refusedIn(group, 'Hi');
    for (const group of ['Width', 'Link']) await refusedIn(group, '', '[data-slot=email-button]');
    await refusedIn('Lanes', 'left');

    await openBlockMenu('Hi');
    await expect.element(page.getByRole('menuitem', { name: 'Duplicate' })).toBeDisabled();
    const refused = page.getByRole('menuitem', { name: 'Delete' });
    await expect.element(refused).toBeDisabled();
    await userEvent.hover(refused, { force: true });
    await expect.element(page.getByText(locked)).toBeVisible();
  });

  it('includes a stored lane ratio the menu does not offer, checked', async () => {
    await mount([
      block({ type: 'columns', attributes: { ratio: [3, 1] }, lanes: [[paragraph('left')], [paragraph('right')]] }),
    ]);
    await openBlockMenu('left');
    await userEvent.click(page.getByRole('menuitem', { name: 'Lanes' }));

    await expect.element(page.getByRole('menuitemradio', { name: '3 : 1' })).toBeChecked();
  });

  it('gives Duplicate a reason on a stored block of a kind the profile leaves out', async () => {
    await mount([paragraph('Header'), block({ type: 'button', content: { label: 'Go' } })], {
      profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }),
    });
    await openBlockMenu('', '[data-slot=email-button]');

    const refused = page.getByRole('menuitem', { name: 'Duplicate' });
    await expect.element(refused).toBeDisabled();
    await userEvent.hover(refused, { force: true });
    await expect.element(page.getByText('This kind of block is not allowed here')).toBeVisible();
  });
  it("disables a required block's attribute items, Turn into and Duplicate with its reason", async () => {
    await mount([paragraph('Keep me', 'kept')], { options: { required: () => ['kept'] } });
    await openBlockMenu('Keep me');
    await expect.element(page.getByRole('menuitem', { name: 'Duplicate' })).toBeDisabled();
    await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));
    await expect.element(page.getByRole('menuitemradio', { name: 'Bulleted list' })).toBeDisabled();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(page.getByRole('menuitem', { name: 'Space after' }));

    const large = page.getByRole('menuitemradio', { name: 'Large' });
    await expect.element(large).toBeDisabled();
    await userEvent.hover(large, { force: true });
    await expect.element(page.getByText('This block is required')).toBeVisible();
  });
  it('adds no block of a kind the profile leaves out, while a full profile takes it', async () => {
    const layout = await mount([paragraph('Header')], { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });
    await caretAfter('Header');
    pasteHtml(buttonHtml);
    expect(typesOf(layout)).not.toContain('emailButton');

    const full = await mount([paragraph('Body')]);
    await caretAfter('Body');
    pasteHtml(buttonHtml);
    await vi.waitFor(() => expect(typesOf(full)).toContain('emailButton'));
  });

  it('brings back a stored block of a left-out kind on undo', async () => {
    const stored = [paragraph('Header', 'p'), block({ id: 'b', key: 'b', type: 'button', content: { label: 'Go' } })];
    const editor = await mount(stored, { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });
    await caretAfter('Header');
    await openBlockMenu('', '[data-slot=email-button]');
    await userEvent.click(page.getByRole('menuitem', { name: 'Delete' }));
    await vi.waitFor(() => expect(typesOf(editor)).toEqual(['paragraph']));
    await vi.waitFor(() => expect(document.activeElement?.classList.contains('ProseMirror')).toBe(true));

    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');

    await vi.waitFor(() => expect(exported(editor)).toEqual(stored));
  });

  it('opens a stored mail layout holding a button in a lane', async () => {
    const stored = [
      block({
        id: 'cols',
        key: 'cols',
        type: 'columns',
        lanes: [
          [block({ id: 'b', key: 'b', type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } })],
          [paragraph('right', 'r')],
        ],
      }),
    ];
    const editor = await mount(stored, { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });

    expect(exported(editor)).toEqual(stored);
  });

  it("keys a custom block, takes the host's id for it, and lets a lane hold it", async () => {
    const editor = await mount(
      [
        block({ type: 'columns', lanes: [[paragraph('left')], [paragraph('right')]] }),
        block({ type: 'note', content: { text: 'Hi' } }),
      ],
      { extra: [note] },
    );

    const added = exported(editor)[1];
    expect(added.key).not.toBe('');
    expect(editor.run('assignBlockIds', { ids: { [added.key]: 'n1' } })).toBe(true);
    expect(exported(editor)[1]).toMatchObject({ id: 'n1', key: added.key, type: 'note' });

    await caretAfter('left');
    editor.run('insertContent', { content: { type: 'note', content: [{ type: 'text', text: 'In a lane' }] } });
    await vi.waitFor(() =>
      expect(exported(editor)[0].lanes?.[0].map(({ type, content }) => [type, content])).toContainEqual([
        'note',
        { text: 'In a lane' },
      ]),
    );
  });

  it('reads a node in several groups by each of them', async () => {
    const aside: EditorFeature = {
      id: 'aside',
      nodes: [{ name: 'aside', group: 'block aside' as 'block', content: 'inline*' }],
      codecs: [
        {
          node: 'aside',
          toEmailBlock: (node) => block({ key: String(node.attrs?.key ?? ''), type: 'aside' }),
          fromEmailBlock: () => null,
        },
      ],
    };
    const tag: EditorFeature = { id: 'tag', nodes: [{ name: 'tag', group: 'inline tag' as 'inline', atom: true }] };
    expect(() => emailKit(fullProfile, [tag])).toThrow(/"tag"/);

    const editor = await mount([paragraph('Body')], { extra: [aside] });
    await caretAfter('Body');
    editor.run('insertContent', { content: { type: 'aside', content: [{ type: 'text', text: 'Aside' }] } });

    await vi.waitFor(() => expect(typesOf(editor)).toContain('aside'));
    const added = editor.getJSON().content?.find((node) => node.type === 'aside');
    expect(added?.attrs?.key).toEqual(expect.any(String));
  });

  it('refuses a custom feature with an inline node or a mark', () => {
    const chip: EditorFeature = { id: 'chip', nodes: [{ name: 'chip', group: 'inline', atom: true }] };
    const shout: EditorFeature = { id: 'shout', marks: [{ name: 'shout', htmlTag: 'mark' }] };
    expect(() => emailKit(fullProfile, [chip])).toThrow(
      expect.objectContaining({ code: 'editor.profile.no_email_codec', message: expect.stringContaining('"chip"') }),
    );
    expect(() => emailKit(fullProfile, [shout])).toThrow(
      expect.objectContaining({ code: 'editor.profile.no_email_codec', message: expect.stringContaining('"shout"') }),
    );
  });

  it('refuses a custom feature whose block has no email codec, naming it', () => {
    const quote: EditorFeature = {
      id: 'quote',
      nodes: [{ name: 'quote', group: 'block', content: 'inline*' }],
    };
    expect(() => emailKit(fullProfile, [quote])).toThrow(
      expect.objectContaining({ code: 'editor.profile.no_email_codec', message: expect.stringContaining('"quote"') }),
    );
    expect(() => emailKit(fullProfile, [standardKit()])).toThrow(/"standard"/);

    expect(() => emailKit(fullProfile, [note])).not.toThrow();
  });
});
