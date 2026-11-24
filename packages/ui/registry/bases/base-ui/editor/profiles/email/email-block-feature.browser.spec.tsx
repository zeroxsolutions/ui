import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { emailProfile, type EditorEmailBlock, type ProfileProblem } from '@zeroxsolutions/editor-core/profiles/index';
import {
  choice,
  defineEmailBlock,
  number,
  plainText,
  richText,
  toggle,
} from '@zeroxsolutions/editor-core/template/email/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { EmailEditor } from './email-editor';

const quote = defineEmailBlock({
  type: 'quote',
  label: 'Quote',
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

const profile = emailProfile({ variables: [{ name: 'name', type: 'string', label: 'Name', sampleValue: 'Lan' }] });

const stored = (attributes: Record<string, unknown> = {}): EditorEmailBlock => ({
  id: 'q1',
  key: 'q1',
  type: 'quote',
  attributes,
  content: { text: 'Kind words', author: 'Lan' },
});

interface Probe {
  editor: IEditor | null;
  reported: EditorEmailBlock[][];
  validated: ProfileProblem[][];
}

function Host({ initial, probe }: { initial: EditorEmailBlock[]; probe: Probe }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="style-nova p-12">
      <EmailEditor
        label="Body"
        profile={profile}
        blocks={[quote]}
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

async function mount(initial: EditorEmailBlock[]): Promise<Probe> {
  const probe: Probe = { editor: null, reported: [], validated: [] };
  await render(<Host initial={initial} probe={probe} />);
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
  await userEvent.hover(await vi.waitFor(() => find('[data-slot=email-block]')));
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
    await userEvent.click(await vi.waitFor(() => find('[data-slot=slash-menu] [data-slot=item]', 'Quote')));

    await userEvent.click(await vi.waitFor(() => find('[data-slot=email-block-body]')));
    await userEvent.keyboard('Kind words');
    await userEvent.click(page.getByRole('textbox', { name: 'Author' }));
    await userEvent.keyboard('Lan');

    await vi.waitFor(() =>
      expect(last(probe.reported)?.find((block) => block.type === 'quote')).toMatchObject({
        type: 'quote',
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

  it('loads a stored block as it was written, and sets a number in its field', async () => {
    const probe = await mount([stored({ size: 1 })]);

    await expect.element(page.getByText('Kind words')).toBeVisible();
    const size = page.getByRole('spinbutton', { name: 'Size' });
    await expect.element(size).toHaveValue(1);
    await userEvent.fill(size, '3');

    await vi.waitFor(() => expect(last(probe.reported)?.[0]).toEqual(stored({ size: 3 })));
  });
});
