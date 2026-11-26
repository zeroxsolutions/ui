import { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { defineBlock } from '@zeroxsolutions/editor-core/blocks/index';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { emailProfile, type EditorEmailBlock, type ProfileProblem } from '@zeroxsolutions/editor-core/profiles/index';
import {
  choice,
  defineEmailBlock,
  items,
  link,
  number,
  plainText,
  richText,
  toggle,
} from '@zeroxsolutions/editor-core/template/email/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { EmailEditor } from './email-editor';

const testimonial = defineEmailBlock({
  type: 'testimonial',
  label: 'Testimonial',
  description: 'A line someone said',
  fields: { text: richText(), author: plainText({ max: 120 }) },
  attributes: {
    tone: choice(['neutral', 'brand'], 'neutral'),
    boxed: toggle(false),
    size: number({ min: 1, max: 3, default: 2 }),
  },
  render: ({ fields }, h) => h.text({ markup: fields.text }),
  sample: { fields: { text: '{{name}} said it', author: 'Lan' }, variableTypes: { name: 'string' } },
});

const social = defineEmailBlock({
  type: 'social',
  label: 'Social',
  fields: {
    links: items({ fields: { label: plainText({ required: true }), href: link({ required: true }) }, min: 1, max: 2 }),
  },
  render: (_view, h) => h.divider(),
  sample: { fields: { links: [{ label: '{{name}}', href: 'https://x.test' }] }, variableTypes: { name: 'string' } },
});

const profile = emailProfile({
  variables: [{ name: 'name', type: 'string', label: 'Name', sampleValue: 'Lan' }],
  blocks: [testimonial, social],
});

const stored = (attributes: Record<string, unknown> = {}): EditorEmailBlock => ({
  id: 'q1',
  key: 'q1',
  type: 'testimonial',
  attributes,
  content: { text: 'Kind words', author: 'Lan' },
});

interface Probe {
  editor: IEditor | null;
  reported: EditorEmailBlock[][];
  validated: ProfileProblem[][];
}

function Host({
  initial,
  probe,
  structure,
}: {
  initial: EditorEmailBlock[];
  probe: Probe;
  structure?: 'free' | 'locked';
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="style-nova p-12">
      <EmailEditor
        label="Body"
        profile={profile}
        blocks={[testimonial, social]}
        structure={structure}
        value={value}
        onChange={(blocks) => {
          probe.reported.push(blocks);
          setValue(blocks);
        }}
        onValidate={(problems) => probe.validated.push(problems)}
        onReady={(editor) => (probe.editor = editor)}
      />
    </div>
  );
}

async function mount(initial: EditorEmailBlock[], structure?: 'free' | 'locked'): Promise<Probe> {
  const probe: Probe = { editor: null, reported: [], validated: [] };
  await render(<Host initial={initial} probe={probe} structure={structure} />);
  await vi.waitFor(() => {
    if (!probe.editor) throw new Error('the editor is not ready');
  });
  return probe;
}

function find(selector: string, text?: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => text === undefined || element.textContent?.includes(text),
  );
  if (!found) throw new Error(`nothing matches ${selector}${text ? ` holding "${text}"` : ''}`);
  return found;
}

const last = <T,>(list: T[]): T | undefined => list[list.length - 1];

async function openBlockMenu(): Promise<void> {
  await userEvent.hover(page.getByTestId('email-block'));
  const grip = await vi.waitFor(() => {
    const found = find('.drag-handle');
    if (found.classList.contains('hide')) throw new Error('the grip is hidden');
    return found;
  });
  await userEvent.click(grip);
  await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();
}

describe('emailBlockFeature', () => {
  it('inserts the block from the slash menu, and exports what is typed in its body and its field', async () => {
    const probe = await mount([{ id: 'p1', key: 'p1', type: 'paragraph', attributes: {}, content: { text: '' } }]);
    await userEvent.click(page.getByRole('textbox', { name: 'Body' }));
    await userEvent.keyboard('/');
    await userEvent.click(page.getByTestId('slash-menu').getByText('Testimonial'));

    await userEvent.click(page.getByTestId('email-block-body'));
    await userEvent.keyboard('Kind words');
    await userEvent.click(page.getByRole('textbox', { name: 'Author' }));
    await userEvent.keyboard('Lan');

    await vi.waitFor(() =>
      expect(last(probe.reported)?.find((block) => block.type === 'testimonial')).toMatchObject({
        type: 'testimonial',
        attributes: {},
        content: { text: 'Kind words', author: 'Lan' },
      }),
    );
    expect(last(probe.validated)?.map((problem) => problem.kind)).not.toContain('unknown-block-type');
    expect(last(probe.validated)?.map((problem) => problem.kind)).not.toContain('block-not-allowed');
  });

  it('sets a choice and a toggle from the block menu', async () => {
    const probe = await mount([stored()]);

    await openBlockMenu();
    await userEvent.click(page.getByRole('menuitem', { name: 'Tone' }));
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Brand', exact: true }));
    await vi.waitFor(() => expect(last(probe.reported)?.[0].attributes).toEqual({ tone: 'brand' }));

    await openBlockMenu();
    await userEvent.click(page.getByRole('menuitemcheckbox', { name: 'Boxed' }));
    await vi.waitFor(() => expect(last(probe.reported)?.[0].attributes).toEqual({ tone: 'brand', boxed: true }));
  });

  it('draws the block as the email does, named by its title and with no caption over its fields', async () => {
    await mount([stored()]);

    const block = page.getByRole('group', { name: 'Testimonial' });
    await expect.element(block.getByText('Kind words')).toBeVisible();
    await expect.element(block.getByRole('textbox', { name: 'Author' })).toHaveTextContent('Lan');
    await expect.element(page.getByTestId('email-block')).not.toHaveTextContent('Testimonial');
    expect(page.getByTestId('email-block').element().querySelector('input, fieldset')).toBeNull();
  });

  it('loads a stored block as it was written, and sets a number in its settings popover', async () => {
    const probe = await mount([stored({ size: 1 })]);

    await expect.element(page.getByText('Kind words')).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Block settings' }));
    const size = page.getByRole('spinbutton', { name: 'Size' });
    await expect.element(size).toHaveValue(1);
    await userEvent.fill(size, '3');

    await vi.waitFor(() => expect(last(probe.reported)?.[0]).toEqual(stored({ size: 3 })));
  });

  it('refuses a block the profile does not name, so the server validates what the editor offers', () => {
    expect(() =>
      renderToString(<EmailEditor label="Body" profile={emailProfile()} blocks={[testimonial]} value={[]} />),
    ).toThrow(/Block "testimonial" is in `blocks` but not in the profile/);
    // A kind named by hand carries no field rules, so the server would not check the block's fields.
    const named = emailProfile({ extraKinds: ['testimonial'] });
    expect(() =>
      renderToString(<EmailEditor label="Body" profile={named} blocks={[testimonial]} value={[]} />),
    ).toThrow(/not in the profile/);
  });

  it('marks a field the renderer would refuse, as the server reads it', async () => {
    const probe = await mount([{ ...stored(), content: { text: 'Kind words', author: 'x'.repeat(121) } }]);

    await vi.waitFor(() =>
      expect(last(probe.validated)).toContainEqual({ kind: 'text-too-long', block: 'q1', field: 'author' }),
    );
  });
});

describe("an items field in the block's view", () => {
  const site = { label: 'Site', href: 'https://x.test' };
  const links = (entries: readonly Record<string, string>[]): EditorEmailBlock => ({
    id: 's1',
    key: 's1',
    type: 'social',
    attributes: {},
    content: { links: entries },
  });

  it('draws a control per stored item, named for its label, that opens its fields in a popover', async () => {
    await mount([links([site, { label: 'Shop', href: '' }])]);

    await expect.element(page.getByRole('button', { name: 'Shop' })).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Site' }));
    const popover = page.getByRole('dialog', { name: 'Links 1' });
    await expect.element(popover.getByRole('textbox', { name: 'Label' })).toHaveTextContent('Site');
    await expect.element(popover.getByRole('textbox', { name: 'Href' })).toHaveTextContent('https://x.test');
  });

  it('adds an item of empty fields up to the most it takes, opens it, and exports what is typed in it', async () => {
    const probe = await mount([links([site])]);

    const add = page.getByRole('button', { name: 'Add to Links' });
    await userEvent.click(add);
    await expect.element(add).toBeDisabled();
    const label = page.getByRole('dialog', { name: 'Links 2' }).getByRole('textbox', { name: 'Label' });
    await expect.element(label).toHaveFocus();
    await userEvent.keyboard('Shop');

    await vi.waitFor(() =>
      expect(last(probe.reported)?.[0].content).toEqual({ links: [site, { label: 'Shop', href: '' }] }),
    );
  });

  it('writes an item link the email can send, and tells why it refuses one it cannot', async () => {
    const probe = await mount([links([site])]);

    await userEvent.click(page.getByRole('button', { name: 'Site' }));
    const href = page.getByRole('dialog', { name: 'Links 1' }).getByRole('textbox', { name: 'Href' });
    await userEvent.click(href);
    await userEvent.keyboard('{Control>}a{/Control}{Meta>}a{/Meta}javascript:alert(1)');
    await expect.element(href).toHaveAttribute('aria-invalid', 'true');
    expect(last(probe.reported)?.[0].content ?? { links: [site] }).toEqual({ links: [site] });

    await userEvent.keyboard('{Control>}a{/Control}{Meta>}a{/Meta}https://y.test');
    await vi.waitFor(() =>
      expect(last(probe.reported)?.[0].content).toEqual({ links: [{ label: 'Site', href: 'https://y.test' }] }),
    );
  });

  it('removes an item down to the fewest it takes, and moves the focus to the add control', async () => {
    const probe = await mount([links([site, { label: 'Shop', href: 'https://y.test' }])]);

    await userEvent.click(page.getByRole('button', { name: 'Site' }));
    await userEvent.click(page.getByRole('dialog', { name: 'Links 1' }).getByRole('button', { name: 'Remove' }));

    await vi.waitFor(() =>
      expect(last(probe.reported)?.[0].content).toEqual({ links: [{ label: 'Shop', href: 'https://y.test' }] }),
    );
    await expect.element(page.getByRole('button', { name: 'Add to Links' })).toHaveFocus();
    await userEvent.click(page.getByRole('button', { name: 'Shop' }));
    await expect
      .element(page.getByRole('dialog', { name: 'Links 1' }).getByRole('button', { name: 'Remove' }))
      .toBeDisabled();
  });

  it("draws its items as they are in locked structure, which refuses a change to a block's fields", async () => {
    await mount([links([site, { label: 'Shop', href: '' }])], 'locked');

    await expect.element(page.getByRole('img', { name: 'Shop' })).toBeVisible();
    expect(page.getByRole('button', { name: 'Shop' }).query()).toBeNull();
    expect(page.getByRole('button', { name: 'Add to Links' }).query()).toBeNull();
  });
});

describe('a block from defineBlock in the email editor', () => {
  const saying = defineBlock({
    type: 'saying',
    label: 'Saying',
    fields: { text: richText(), author: plainText() },
    email: {
      render: ({ fields }, h) => h.text({ markup: fields.text }),
      sample: { fields: { text: '{{name}} said it', author: 'Lan' }, variableTypes: { name: 'string' } },
    },
    document: {
      html: (view, markup) => markup`<blockquote>${view.body}<cite>${view.fields.author}</cite></blockquote>`,
    },
  });
  const sayings = emailProfile({ blocks: [saying] });

  function SayingHost({ probe }: { probe: Probe }) {
    const [value, setValue] = useState<EditorEmailBlock[]>([
      { id: 's1', key: 's1', type: 'saying', attributes: {}, content: { text: 'Kind words', author: '' } },
    ]);
    return (
      <EmailEditor
        label="Body"
        profile={sayings}
        blocks={[saying]}
        value={value}
        onChange={(blocks) => {
          probe.reported.push(blocks);
          setValue(blocks);
        }}
        onReady={(editor) => (probe.editor = editor)}
      />
    );
  }

  it('edits the block on its shared node and exports it as stored', async () => {
    const probe: Probe = { editor: null, reported: [], validated: [] };
    await render(<SayingHost probe={probe} />);

    await expect.element(page.getByText('Kind words')).toBeVisible();
    await userEvent.click(page.getByRole('textbox', { name: 'Author' }));
    await userEvent.keyboard('Lan');

    await vi.waitFor(() =>
      expect(last(probe.reported)).toEqual([
        { id: 's1', key: 's1', type: 'saying', attributes: {}, content: { text: 'Kind words', author: 'Lan' } },
      ]),
    );
  });

  it('refuses a block with no email side', () => {
    const pageNote = defineBlock({
      type: 'pageNote',
      label: 'Page note',
      fields: { title: plainText() },
      document: { html: (view, markup) => markup`<p>${view.fields.title}</p>` },
    });
    expect(() =>
      renderToString(<EmailEditor label="Body" profile={emailProfile()} blocks={[pageNote]} value={[]} />),
    ).toThrow(/not in the profile/);
  });
});
