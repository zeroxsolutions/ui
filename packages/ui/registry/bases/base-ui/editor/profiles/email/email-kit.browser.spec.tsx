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
import { EmailLinkPopover } from './email-link-popover';

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
  popover,
  onReady,
}: {
  profile: EditorProfile;
  blocks: EditorEmailBlock[];
  extra: EditorFeature[];
  options?: EmailKitOptions;
  popover: boolean;
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
      {editor && popover && <EmailLinkPopover editor={editor} />}
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
    popover = true,
  }: { profile?: EditorProfile; options?: EmailKitOptions; extra?: EditorFeature[]; popover?: boolean } = {},
): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(
    <EmailHarness
      profile={profile}
      blocks={blocks}
      extra={extra}
      options={options}
      popover={popover}
      onReady={(e) => (ready = e)}
    />,
  );
  return vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
}

const exported = (editor: IEditor) => toEmailBlocks(editor.getJSON(), codecs);
/** The blocks `editor` exports under `profile`, which decides what folds into a paragraph. */
const exportedFor = (editor: IEditor, profile: EditorProfile = fullProfile) =>
  toEmailBlocks(editor.getJSON(), codecs, { kinds: profile.kinds });

/** Pastes `html` at the caret, as the clipboard of another editor carries it. */
function pasteHtml(html: string): void {
  const data = new DataTransfer();
  data.setData('text/html', html);
  (document.activeElement ?? find('[contenteditable=true]')).dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
  );
}

const buttonHtml = '<div data-type="button" label="Go" href="{{resetUrl}}"></div>';
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

/** Opens the link popover of the only button from its block menu. */
async function openButtonLink() {
  await openBlockMenu('', '[data-slot=link-button]');
  await userEvent.click(page.getByRole('menuitem', { name: 'Link' }));
  const popover = page.getByRole('dialog', { name: 'Link' });
  await expect.element(popover).toBeVisible();
  return popover;
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
      'Heading',
      'Quote',
      'Image',
      'Table',
      'Hero',
      'Card',
      'Social links',
      'Spacer',
      'Legal footer',
    ]);
  });

  it.each([
    ['Hero', 'hero'],
    ['Card', 'card'],
    ['Social links', 'socialLinks'],
    ['Spacer', 'spacer'],
    ['Legal footer', 'legalFooter'],
  ])('inserts a %s from the slash menu, exported as its email block', async (title, type) => {
    const editor = await mount([paragraph('')]);
    await userEvent.click(find('[contenteditable=true] p'));
    await userEvent.keyboard('/');
    await userEvent.click(await vi.waitFor(() => find('[data-slot=slash-menu] [data-slot=item]', title)));
    await vi.waitFor(() => expect(exportedFor(editor).map((exported) => exported.type)).toContain(type));
  });

  it("inserts a library block through the kit's own command where the profile allows it", async () => {
    const editor = await mount([paragraph('Hi')]);
    await caretAfter('Hi');
    expect(editor.run('insertEmailBlock', { kind: 'spacer' })).toBe(true);
    await vi.waitFor(() => expect(exportedFor(editor).map((exported) => exported.type)).toContain('spacer'));

    const layout = await mount([paragraph('Header')], { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });
    await caretAfter('Header');
    expect(layout.can('insertEmailBlock', { kind: 'hero' })).toBe(false);
  });

  it('carries a stored hero, card, social links, spacer and legal footer through the editor unchanged', async () => {
    const feature = {
      image: 'https://x.test/h.png',
      alt: 'A bay',
      heading: 'Hello {{name}}',
      text: 'Come **soon**',
      buttonLabel: 'Go',
      buttonHref: '{{resetUrl}}',
    };
    const stored: EditorEmailBlock[] = [
      block({ id: 'h', key: 'h', type: 'hero', attributes: { align: 'center' }, content: feature }),
      block({ id: 'c', key: 'c', type: 'card', content: { ...feature, buttonLabel: '', buttonHref: '' } }),
      block({
        id: 's',
        key: 's',
        type: 'socialLinks',
        attributes: { size: 'small' },
        content: { links: [{ label: 'Blog', icon: 'https://x.test/i.png', href: 'https://x.test/b' }] },
      }),
      block({ id: 'p', key: 'p', type: 'spacer', attributes: { height: 'large' } }),
      block({
        id: 'f',
        key: 'f',
        type: 'legalFooter',
        content: { text: 'You joined.', address: '1 Road', unsubscribe: '{{resetUrl}}', unsubscribeLabel: '' },
      }),
    ];
    const editor = await mount(stored);
    expect(exportedFor(editor)).toEqual(stored);
    expect(exported(editor)).toEqual(stored);
  });

  it.each([
    ['Heading', { type: 'heading', attributes: { level: 2 }, content: { text: '' } }],
    ['Quote', { type: 'quote', attributes: {}, content: { text: '' } }],
    ['Image', { type: 'image', attributes: {}, content: { src: '', alt: '' } }],
    [
      'Table',
      {
        type: 'table',
        attributes: { header: true },
        content: {
          rows: [
            ['', ''],
            ['', ''],
          ],
        },
      },
    ],
  ])('inserts a %s from the slash menu, exported as its email block', async (title, block) => {
    const editor = await mount([paragraph('')]);
    await userEvent.click(find('[contenteditable=true] p'));
    await userEvent.keyboard('/');
    await userEvent.click(await vi.waitFor(() => find('[data-slot=slash-menu] [data-slot=item]', title)));
    await vi.waitFor(() =>
      expect(exportedFor(editor).map(({ id: _id, key: _key, ...rest }) => rest)).toContainEqual(block),
    );
  });

  it('carries a stored heading, quote, image and table through the editor unchanged', async () => {
    const stored: EditorEmailBlock[] = [
      block({
        id: 'h',
        key: 'h',
        type: 'heading',
        attributes: { level: 1, align: 'center' },
        content: { text: 'Hi **{{name}}**' },
      }),
      block({ id: 'q', key: 'q', type: 'quote', attributes: { spaceAfter: 'large' }, content: { text: '_Said_' } }),
      block({
        id: 'i',
        key: 'i',
        type: 'image',
        attributes: { align: 'center', width: 300 },
        content: { src: 'https://x.test/a.png', alt: 'A bay', caption: 'Morning', href: '{{resetUrl}}' },
      }),
      block({
        id: 't',
        key: 't',
        type: 'table',
        attributes: { header: true },
        content: {
          rows: [
            ['a', 'b'],
            ['**c**', ''],
          ],
        },
      }),
    ];
    const editor = await mount(stored);
    expect(exportedFor(editor)).toEqual(stored);
  });

  it("sets a heading's level from the block menu", async () => {
    const editor = await mount([
      block({ id: 'h', key: 'h', type: 'heading', attributes: { level: 2 }, content: { text: 'Title' } }),
    ]);
    await chooseInBlockMenu('Title', 'Level', 'Heading 1', '[contenteditable=true] h2');
    await vi.waitFor(() => expect(exportedFor(editor)[0].attributes).toEqual({ level: 1 }));
  });

  it('offers in the slash menu only the kinds a mail-layout region holds', async () => {
    await mount([paragraph('')], { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });

    expect(await slashTitles()).toEqual(['Text', 'Bulleted list', 'Callout', 'Divider', 'Columns']);
  });

  it('folds a heading pasted into a mail-layout region into a paragraph, and marks it', async () => {
    const layout = emailProfile({ allow: MAIL_LAYOUT_KINDS });
    const editor = await mount([paragraph('')], { profile: layout });
    await userEvent.click(find('[contenteditable=true] p'));
    pasteHtml('<h2>Pasted</h2>');
    await vi.waitFor(() => expect(exportedFor(editor, layout).map((one) => one.type)).toEqual(['paragraph']));
  });

  it("draws the document editor's grip and its insert button beside a block", async () => {
    await mount([paragraph('Hello')]);

    await gripOf('[contenteditable=true] p', 'Hello');

    expect(document.querySelector('[data-editor-add]')).not.toBeNull();
  });

  it("offers a button's link the url variables only, read as the popover opens, and sets one in one click", async () => {
    const declarations = [...declared];
    const editor = await mount([block({ type: 'button', content: { label: 'Reset', href: '{{resetUrl}}' } })], {
      options: { declarations: () => declarations },
    });
    declarations.push({ name: 'laterUrl', type: 'url', label: 'Later link' });

    const popover = await openButtonLink();
    const choices = popover.getByRole('group', { name: 'Variables' }).getByRole('button');
    await expect.element(choices.nth(0)).toBeVisible();
    expect(choices.elements().map((choice) => choice.textContent)).toEqual(['Reset link', 'Help page', 'Later link']);
    await userEvent.click(popover.getByRole('button', { name: 'Help page' }));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ label: 'Reset', href: '{{helpUrl}}' }));
    await expect.element(popover).not.toBeInTheDocument();
  });

  it("types a button's href with a variable inside it, and marks one that is not declared", async () => {
    const editor = await mount([block({ type: 'button', content: { label: 'Reset', href: '{{resetUrl}}' } })]);

    const popover = await openButtonLink();
    const field = popover.getByRole('textbox', { name: 'Link' });
    await expect.element(field.getByText('Reset link')).toBeVisible();
    await userEvent.click(field);
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}{Backspace}https://x.test/a?t={{{{nope}}');
    await expect.element(field.getByText('nope')).toHaveAttribute('data-problem', 'variable-undeclared');
    await expect.element(popover.getByText('This variable is not declared: {{nope}}')).toBeVisible();
    await expect.element(field).toHaveAttribute('aria-invalid', 'true');

    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}{Backspace}https://x.test/a?t={{{{name}}{Enter}');
    await vi.waitFor(() =>
      expect(exported(editor)[0].content).toEqual({ label: 'Reset', href: 'https://x.test/a?t={{name}}' }),
    );
  });

  it("disables a locked button's href field and its choices, with the reason", async () => {
    const editor = await mount([block({ type: 'button', content: { label: 'Reset', href: '{{resetUrl}}' } })], {
      options: { structure: () => 'locked' },
    });

    const popover = await openButtonLink();
    await expect.element(popover.getByRole('textbox', { name: 'Link' })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(popover.getByRole('button', { name: 'Help page' })).toBeDisabled();
    await expect.element(popover.getByRole('button', { name: 'Apply' })).toBeDisabled();
    await expect.element(popover.getByText('The structure is locked: only text and variables change')).toBeVisible();
    expect(exported(editor)[0].content).toEqual({ label: 'Reset', href: '{{resetUrl}}' });
  });

  it("inserts a variable chip in a button's label from the {{ menu, exported as its token", async () => {
    const editor = await mount([block({ type: 'button', content: { label: 'Continue', href: '{{resetUrl}}' } })]);

    await userEvent.click(page.getByRole('textbox', { name: 'Button label' }));
    await userEvent.keyboard('{End} {{{{');
    const menu = await vi.waitFor(() => find('[data-slot=trigger-menu]'));
    expect(menu.textContent).toContain('Name');
    await userEvent.keyboard('nam{Enter}');

    await vi.waitFor(() =>
      expect(exported(editor)[0].content).toEqual({ label: 'Continue {{name}}', href: '{{resetUrl}}' }),
    );
    await expect
      .element(page.getByRole('textbox', { name: 'Button label' }).getByText('Name'))
      .toHaveAttribute('data-slot', 'variable');
  });

  it('opens the block menu of a button whose label field holds the focus with Mod-/', async () => {
    const editor = await mount([
      paragraph('Before'),
      block({ type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
    ]);
    await caretAfter('Before');
    await userEvent.click(page.getByRole('textbox', { name: 'Button label' }));
    await userEvent.keyboard('{ControlOrMeta>}/{/ControlOrMeta}');
    await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();

    await userEvent.click(page.getByRole('menuitem', { name: 'Width' }));
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Full width' }));

    await vi.waitFor(() => expect(exported(editor)[1].attributes).toEqual({ width: 'full' }));
    expect(exported(editor)[0].attributes).toEqual({});
  });
  it('links the selected text to an href typed with a variable inside it', async () => {
    const editor = await mount([paragraph('Open the page')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    await userEvent.click(find('[data-slot=editor-toolbar] [aria-label=Link]'));
    const popover = page.getByRole('dialog', { name: 'Link' });
    await expect.element(popover.getByRole('textbox', { name: 'Link' })).toHaveFocus();
    await userEvent.keyboard('https://x.test/a?t={{{{name}}');
    await userEvent.click(popover.getByRole('button', { name: 'Apply' }));

    await vi.waitFor(() =>
      expect(exported(editor)[0].content).toEqual({ text: 'Open the [page](https://x.test/a?t={{name}})' }),
    );
  });

  it('opens the link the caret is in from the bubble, and removes it whole', async () => {
    const editor = await mount([paragraph('Open the [page]({{resetUrl}})')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{ArrowLeft}{Shift>}{ArrowLeft}{/Shift}');

    await userEvent.click(await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label=Link]')));
    const popover = page.getByRole('dialog', { name: 'Link' });
    await expect.element(popover.getByRole('textbox', { name: 'Link' }).getByText('Reset link')).toBeVisible();
    await userEvent.click(popover.getByRole('button', { name: 'Remove link' }));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open the page' }));
  });

  it('links a wider selection to the href of the link inside it', async () => {
    const editor = await mount([paragraph('Open the [page]({{resetUrl}})')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Shift>}' + '{ArrowLeft}'.repeat(8) + '{/Shift}');

    await userEvent.click(find('[data-slot=editor-toolbar] [aria-label=Link]'));
    const popover = page.getByRole('dialog', { name: 'Link' });
    await expect.element(popover.getByRole('textbox', { name: 'Link' }).getByText('Reset link')).toBeVisible();
    expect(popover.getByRole('button', { name: 'Remove link' }).query()).not.toBeNull();
    await userEvent.click(popover.getByRole('button', { name: 'Apply' }));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open [the page]({{resetUrl}})' }));
  });

  it('opens no link popover on a caret outside a link', async () => {
    const editor = await mount([paragraph('Open the page')]);
    await caretAfter('Open the page');

    expect(editor.can('editEmailLink')).toBe(false);
    expect(editor.run('editEmailLink')).toBe(false);
  });

  it('offers no link edit while no link popover is drawn', async () => {
    const editor = await mount([paragraph('Open the [page]({{resetUrl}})')], { popover: false });
    await caretAfter('Open the page');
    await userEvent.keyboard('{ArrowLeft}');

    await vi.waitFor(() => expect(editor.isActive('emailLink')).toBe(true));
    expect(editor.can('editEmailLink')).toBe(false);
  });

  it('widens a selection cutting into a link to the whole link, so Remove link takes all of it', async () => {
    const editor = await mount([paragraph('Open the [page]({{resetUrl}}) now')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Home}' + '{ArrowRight}'.repeat(5) + '{Shift>}' + '{ArrowRight}'.repeat(6) + '{/Shift}');

    await userEvent.click(find('[data-slot=editor-toolbar] [aria-label=Link]'));
    const popover = page.getByRole('dialog', { name: 'Link' });
    await expect.element(popover.getByRole('textbox', { name: 'Link' }).getByText('Reset link')).toBeVisible();
    await userEvent.click(popover.getByRole('button', { name: 'Remove link' }));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open the page now' }));
  });

  it('shows no href over links of several hrefs, and links the whole selection to the one applied', async () => {
    const editor = await mount([paragraph('[One](https://x.test/1) and [two](https://x.test/2)')]);
    await caretAfter('One and two');
    await userEvent.keyboard('{Shift>}{Home}{/Shift}');

    await userEvent.click(find('[data-slot=editor-toolbar] [aria-label=Link]'));
    const popover = page.getByRole('dialog', { name: 'Link' });
    const field = popover.getByRole('textbox', { name: 'Link' });
    await expect.element(field).toHaveFocus();
    expect(field.element().textContent).toBe('');
    expect(popover.getByRole('button', { name: 'Remove link' }).query()).not.toBeNull();
    await userEvent.keyboard('https://x.test/3{Enter}');

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: '[One and two](https://x.test/3)' }));
  });

  it('gives the focus back to the text when Escape closes the popover', async () => {
    await mount([paragraph('Open the page')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    await userEvent.click(find('[data-slot=editor-toolbar] [aria-label=Link]'));
    const popover = page.getByRole('dialog', { name: 'Link' });
    await expect.element(popover.getByRole('textbox', { name: 'Link' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');

    await expect.element(popover).not.toBeInTheDocument();
    await vi.waitFor(() => expect(document.activeElement).toBe(find('[contenteditable=true]')));
  });

  it('widens a selection ending inside a link in a later block to the whole of that link', async () => {
    const editor = await mount([paragraph('First line', 'p1'), paragraph('[Open](https://x.test/o) it', 'p2')]);
    await caretAfter('Open it');
    await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}{Shift>}{ArrowUp}{Home}{/Shift}');

    await userEvent.click(find('[data-slot=editor-toolbar] [aria-label=Link]'));
    const popover = page.getByRole('dialog', { name: 'Link' });
    await expect.element(popover.getByRole('textbox', { name: 'Link' })).toHaveFocus();
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}{Backspace}https://x.test/n{Enter}');

    await vi.waitFor(() =>
      expect(exported(editor).map((stored) => stored.content)).toEqual([
        { text: '[First line](https://x.test/n)' },
        { text: '[Open](https://x.test/n) it' },
      ]),
    );
  });

  it('closes the popover when the document changes from outside', async () => {
    const editor = await mount([block({ type: 'button', content: { label: 'Reset', href: '{{resetUrl}}' } })]);
    const popover = await openButtonLink();

    editor.setContent(fromEmailBlocks([paragraph('Another email')], codecs));

    await expect.element(popover).not.toBeInTheDocument();
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
    expect(editor.can('toggleMark', { name: 'bold' })).toBe(false);
    await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}{ControlOrMeta>}i{/ControlOrMeta}');

    expect(exported(editor)).toEqual(blocks);
    expect(JSON.stringify(editor.getJSON())).not.toContain('"marks"');
  });

  it('turns a typed shortcut into a heading where the profile holds one', async () => {
    const editor = await mount([paragraph('Hello')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Enter}# Title');

    await vi.waitFor(() =>
      expect(exportedFor(editor)[1]).toMatchObject({
        type: 'heading',
        attributes: { level: 1 },
        content: { text: 'Title' },
      }),
    );
  });

  it('turns no typed shortcut into a heading where the profile holds none, and keeps no underline', async () => {
    const editor = await mount([paragraph('Hello')], { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });
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

  it('keeps a pasted heading as a heading, which a mail layout exports as its text', async () => {
    const layout = emailProfile({ allow: MAIL_LAYOUT_KINDS });
    const editor = await mount([paragraph('Body')], { profile: layout });
    await caretAfter('Body');
    // Between two paragraphs, so the heading is pasted whole rather than joined to the line it lands in.
    pasteHtml('<p>Before</p><h1>Hi</h1><p>After</p>');

    await vi.waitFor(() => expect(typesOf(editor)).toContain('heading'));
    expect(exportedFor(editor, layout).map(({ type, content }) => [type, content])).toContainEqual([
      'paragraph',
      { text: 'Hi' },
    ]);
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

    await chooseInBlockMenu('', 'Width', 'Full width', '[data-slot=link-button]');

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
      content: { type: 'columns', content: [{ type: 'column', content: [{ type: 'paragraph' }] }] },
    });

    const lanes = editor.getJSON().content?.flatMap((node) => node.content ?? []) ?? [];
    expect(lanes.filter((lane) => lane.type === 'column').length).toBeGreaterThan(0);
    for (const lane of lanes) {
      expect((lane.content ?? []).map((child) => child.type)).not.toContain('columns');
    }
  });

  it('keeps every block but a line out of a table cell, where the export would lose it', async () => {
    const editor = await mount([block({ type: 'table', content: { rows: [['cellA', 'cellB']] } })]);
    await caretAfter('cellA');

    for (const kind of ['image', 'columns', 'table', 'button', 'divider', 'heading', 'quote', 'list'] as const) {
      expect(editor.can('insertEmailBlock', { kind })).toBe(false);
      expect(editor.run('insertEmailBlock', { kind })).toBe(false);
    }
    expect(editor.can('insertEmailBlock', { kind: 'paragraph' })).toBe(true);
  });

  it("offers no way around the kit's own insert for a button or columns", async () => {
    const editor = await mount([block({ type: 'columns', lanes: [[paragraph('left')], [paragraph('right')]] })]);
    await caretAfter('left');
    expect(() => editor.run('insertColumns', { count: 2 })).toThrow(/Unknown command/);
    expect(() => editor.run('insertButton')).toThrow(/Unknown command/);
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

    for (const slot of ['link-button', 'code-card', 'email-html', 'divider', 'columns']) {
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
    await refusedIn('Width', '', '[data-slot=link-button]');
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
    await openBlockMenu('', '[data-slot=link-button]');

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
    expect(typesOf(layout)).not.toContain('button');

    const full = await mount([paragraph('Body')]);
    await caretAfter('Body');
    pasteHtml(buttonHtml);
    await vi.waitFor(() => expect(typesOf(full)).toContain('button'));
  });

  it('brings back a stored block of a left-out kind on undo', async () => {
    const stored = [paragraph('Header', 'p'), block({ id: 'b', key: 'b', type: 'button', content: { label: 'Go' } })];
    const editor = await mount(stored, { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });
    await caretAfter('Header');
    await openBlockMenu('', '[data-slot=link-button]');
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
