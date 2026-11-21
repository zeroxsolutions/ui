import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  emailProfile,
  toEmailBlocks,
  validate,
  type EditorEmailBlock,
  type EditorProfile,
  type ProfileProblem,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import {
  createEmailRenderer,
  type EmailTheme,
  type RenderEmailInput,
} from '@zeroxsolutions/editor-core/template/email/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import {
  EmailEditor,
  type EmailEditorProps,
  type EmailPreviewInput,
  type EmailPreviewProps,
  type EmailPreviewRenderer,
} from './email-editor';
import { problemMessage, RENDER_PROBLEM_MESSAGES } from '../problem-messages';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name', sampleValue: 'Lan' },
  { name: 'resetUrl', type: 'url', label: 'Reset link', sampleValue: 'https://example.test/reset' },
];

const profile = emailProfile({ variables: declared });

const theme: EmailTheme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#09090B',
    primary: '#007A55',
    primaryForeground: '#ECFDF5',
    muted: '#F4F4F5',
    mutedForeground: '#63636D',
    border: '#E4E4E7',
  },
  radius: 10,
  font: { family: 'Inter', fallback: 'Arial, Helvetica, sans-serif' },
};

const layoutProps = {
  logo: { url: 'https://cdn.example.test/logo@2x.png', alt: 'Example', width: 120 },
  footer: ['Example Company Limited.'],
};

const previewInput = { subject: 'Hello', preheader: null, locale: 'vi', layoutProps } satisfies EmailPreviewInput;

const sampled = {
  variables: { name: 'Lan', resetUrl: 'https://example.test/reset' },
  variableTypes: { name: 'string', resetUrl: 'url' },
} as const;

/** The blocks a render takes, a key standing in for each missing id. */
function withIds(blocks: readonly EditorEmailBlock[]): RenderEmailInput<unknown>['blocks'] {
  return blocks.map(({ lanes, ...block }) => ({
    ...block,
    id: block.id ?? block.key,
    ...(lanes ? { lanes: lanes.map(withIds) } : {}),
  }));
}

const paragraph = (text: string, id: string | null = null): EditorEmailBlock => ({
  id,
  key: id ?? '',
  type: 'paragraph',
  attributes: {},
  content: { text },
});

interface Probe {
  editor: IEditor | null;
  reported: EditorEmailBlock[][];
  validated: ProfileProblem[][];
  blurs: number;
  /** Hands the editor a new value, as a host loading another locale does. */
  load(value: EditorEmailBlock[]): void;
  /** Changes what the host draws beside each block. */
  adorn(adornment: (id: string | null, key: string) => ReactNode): void;
  /** Hands the editor another profile, as a host whose declarations changed does. */
  declare(profile: EditorProfile): void;
}

interface HarnessProps {
  profile: EditorProfile;
  required?: readonly string[];
  structure?: 'free' | 'locked';
  preview?: { renderer: EmailPreviewRenderer; input: EmailPreviewInput };
  renderBlockAdornment?: EmailEditorProps['renderBlockAdornment'];
  initial: EditorEmailBlock[];
  probe: Probe;
}

/** A host that stores what the editor reports and hands it back as the value, as travel's rows do. */
function Host({ initial, probe, renderBlockAdornment, profile: first, preview, ...props }: HarnessProps) {
  const [value, setValue] = useState(initial);
  const [current, setProfile] = useState(first);
  probe.declare = setProfile;
  const [adornment, setAdornment] = useState(() => renderBlockAdornment);
  probe.load = setValue;
  probe.adorn = (next) => setAdornment(() => next);
  const previewProps: EmailPreviewProps = preview ? { renderer: preview.renderer, previewInput: preview.input } : {};
  return (
    <div className="style-nova p-12">
      <EmailEditor
        {...props}
        {...previewProps}
        profile={current}
        value={value}
        renderBlockAdornment={adornment}
        onChange={(blocks) => {
          probe.reported.push(blocks);
          setValue(blocks);
        }}
        onValidate={(problems) => probe.validated.push(problems)}
        onBlur={() => (probe.blurs += 1)}
        onReady={(editor) => (probe.editor = editor)}
      />
      <button type="button">Elsewhere</button>
    </div>
  );
}

async function mount(
  initial: EditorEmailBlock[],
  props: Omit<HarnessProps, 'initial' | 'probe' | 'profile'> & { profile?: EditorProfile } = {},
): Promise<Probe & { editor: IEditor }> {
  const probe: Probe = {
    editor: null,
    reported: [],
    validated: [],
    blurs: 0,
    load: () => {},
    adorn: () => {},
    declare: () => {},
  };
  await render(<Host profile={profile} {...props} initial={initial} probe={probe} />);
  await vi.waitFor(() => {
    if (!probe.editor) throw new Error('the editor is not ready');
  });
  return probe as Probe & { editor: IEditor };
}

function find(selector: string, text?: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => text === undefined || element.textContent?.includes(text),
  );
  if (!found) throw new Error(`nothing matches ${selector}${text ? ` holding "${text}"` : ''}`);
  return found;
}

async function caretAfter(text: string): Promise<void> {
  const element = await vi.waitFor(() => find('[contenteditable=true] p', text));
  await userEvent.click(element);
  await userEvent.keyboard('{End}');
}

const last = <T,>(list: T[]): T | undefined => list[list.length - 1];

const exportedOf = (editor: IEditor) => toEmailBlocks(editor.getJSON());

describe('EmailEditor', () => {
  it('loads its value and reports each edit as blocks', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard(' there');

    await vi.waitFor(() =>
      expect(last(probe.reported)?.map(({ id, content }) => [id, content])).toEqual([['p1', { text: 'Hello there' }]]),
    );
  });

  it('loads a value the host changes, and does not reload the one it reported', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}abc');
    // Each reported value came back as the value; a reload would have moved the caret out of the word.
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabcllo'));

    probe.load([paragraph('Xin chao', 'p1')]);
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Xin chao'));
  });

  it('does not reload a value of the same content with its keys in another order', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}a');
    const reported = await vi.waitFor(() => {
      const blocks = last(probe.reported);
      expect(blocks?.[0].content).toEqual({ text: 'Heallo' });
      return blocks as EditorEmailBlock[];
    });

    const reversed = <T extends object>(object: T): T => Object.fromEntries(Object.entries(object).reverse()) as T;
    probe.load(reported.map((block) => reversed({ ...block, content: reversed(block.content) })));
    await userEvent.keyboard('b');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabllo'));
  });

  it('does not reload a refetched copy of the same content whose saved blocks carry no keys', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}a');
    const reported = await vi.waitFor(() => {
      const blocks = last(probe.reported);
      expect(blocks?.[0].content).toEqual({ text: 'Heallo' });
      return blocks as EditorEmailBlock[];
    });

    probe.load(reported.map(({ key: _key, ...block }) => block as EditorEmailBlock));
    await userEvent.keyboard('b');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabllo'));
  });

  it('tells the host when the focus leaves it, and not while it is in a popup the editor opened', async () => {
    const probe = await mount([paragraph('Hello')]);
    await caretAfter('Hello');
    await userEvent.click(find('[data-slot=variable-menu]'));
    const option = await vi.waitFor(() => find('[data-slot=combobox-item]', 'Reset link'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(0);

    await userEvent.click(option);
    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ text: 'Hello{{resetUrl}}' }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(0);
    await userEvent.click(find('button', 'Elsewhere'));

    await vi.waitFor(() => expect(probe.blurs).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(1);
  });

  it('marks a problem in place within a second, with its message on hover and on focus', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Shift>}{Home}{/Shift}{Backspace}');

    const message = problemMessage({ kind: 'text-empty', block: 'p1', field: 'text' });
    const marker = await vi.waitFor(() => find('[data-slot=email-problem-marker]'), { timeout: 1000 });
    const decorated = find('[contenteditable=true] [data-problem]');
    expect(document.getElementById(decorated.getAttribute('aria-describedby') ?? '')?.textContent).toBe(message);

    await userEvent.hover(marker);
    await vi.waitFor(() => expect(find('[data-slot=tooltip-content]').textContent).toBe(message));
    await userEvent.unhover(marker);
    await vi.waitFor(() => expect(document.querySelector('[data-slot=tooltip-content]')).toBeNull());

    marker.focus();
    await vi.waitFor(() => expect(find('[data-slot=tooltip-content]').textContent).toBe(message));
    expect(last(probe.validated)).toEqual(validate(last(probe.reported) ?? [], profile));
  });

  it('reaches each problem from the text with F8 and Shift+F8, and goes back to its block with Escape', async () => {
    const probe = await mount([paragraph('One', 'p1'), paragraph('', 'p2'), paragraph('Three {{nobody}}', 'p3')]);
    const markers = await vi.waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('[data-slot=email-problem-marker]')];
      expect(found).toHaveLength(2);
      return found;
    });
    await caretAfter('One');

    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(markers[0]);
    const empty = problemMessage({ kind: 'text-empty', block: 'p2' });
    await vi.waitFor(() => expect(find('[data-slot=tooltip-content]').textContent).toBe(empty));
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(markers[1]);
    await userEvent.keyboard('{Shift>}{F8}{/Shift}');
    expect(document.activeElement).toBe(markers[0]);

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('contenteditable')).toBe('true'));
    await userEvent.keyboard('Two');
    await vi.waitFor(() => expect(last(probe.reported)?.[1].content).toEqual({ text: 'Two' }));
    expect(probe.blurs).toBe(0);
  });

  it('marks the token a problem names, and validates once on mount', async () => {
    const probe = await mount([paragraph('Hi {{nobody}}', 'p1')]);

    await vi.waitFor(() => expect(probe.validated).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(probe.validated).toHaveLength(1);
    expect(probe.validated[0]).toEqual([{ kind: 'variable-undeclared', block: 'p1', field: 'text', name: 'nobody' }]);
    const token = await vi.waitFor(() => find('[contenteditable=true] [data-problem]'));
    expect(token.closest('p')).not.toBe(token);
    expect(token.textContent).toContain('nobody');
  });

  it('reads the declarations again when the profile changes them', async () => {
    const probe = await mount([paragraph('Hi {{name}}', 'p1')]);
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('Name'));

    probe.declare(emailProfile({ variables: [{ ...declared[0], label: 'First name' }, declared[1]] }));
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('First name'));
  });

  it('draws the adornment beside each block, lanes included, and redraws it when the host does', async () => {
    const lane = (id: string, text: string) => [paragraph(text, id)];
    const probe = await mount(
      [
        paragraph('Top', 'p1'),
        {
          id: 'c1',
          key: 'c1',
          type: 'columns',
          attributes: { ratio: [1, 1] },
          content: {},
          lanes: [lane('l1', 'Left'), lane('l2', 'Right')],
        },
      ],
      { renderBlockAdornment: (id) => <span>badge {id}</span> },
    );

    await vi.waitFor(() =>
      expect([...document.querySelectorAll('[data-slot=email-block-adornment]')].map((row) => row.textContent)).toEqual(
        ['badge p1', 'badge c1', 'badge l1', 'badge l2'],
      ),
    );
    probe.adorn((id) => <span>stale {id}</span>);
    await vi.waitFor(() => expect(find('[data-slot=email-block-adornment]').textContent).toBe('stale p1'));
  });

  it("disables a required block's Delete with its reason", async () => {
    await mount([paragraph('Keep me', 'kept')], { required: ['kept'] });
    await caretAfter('Keep me');
    await userEvent.click(await vi.waitFor(() => find('[data-slot=email-block-menu] [aria-label="Block actions"]')));

    const refused = await vi.waitFor(() => find('[role=menuitem]', 'Delete'));
    expect(refused.hasAttribute('data-disabled')).toBe(true);
    expect(refused.textContent).toContain('This block is required');
  });

  it('offers no insert and no remove in locked structure', async () => {
    await mount([paragraph('Hi', 'p1')], { structure: 'locked' });
    await caretAfter('Hi');
    await userEvent.keyboard(' /');

    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toBe('Hi /'));
    expect(document.querySelector('[data-slot=slash-menu]')).toBeNull();
    expect(document.querySelector('[data-slot=email-block-menu]')).toBeNull();
  });

  it("previews the renderer's HTML for the blocks, keys standing in for ids, with the sample values", async () => {
    const renderer = createEmailRenderer({ theme });
    const probe = await mount([paragraph('Hi {{name}}', 'p1')], { preview: { renderer, input: previewInput } });
    await caretAfter('Hi');
    await userEvent.keyboard('{Enter}More');

    const frame = await vi.waitFor(() => {
      const found = find('iframe[data-slot=email-preview]') as HTMLIFrameElement;
      expect(found.srcdoc).toContain('More');
      return found;
    });
    const expected = renderer.render({ ...previewInput, ...sampled, blocks: withIds(last(probe.reported) ?? []) });
    expect(frame.srcdoc).toBe(expected.html);
    expect(frame.getAttribute('sandbox')).toBe('');
  });

  it('previews a columns block, keys standing in for the ids of its lanes, and lists the render problems', async () => {
    const renderer = createEmailRenderer({ theme });
    const lanes = [[paragraph('Left')], [paragraph('Right {{nobody}}')]];
    const columns: EditorEmailBlock = {
      id: 'c1',
      key: 'c1',
      type: 'columns',
      attributes: { ratio: [1, 1] },
      content: {},
      lanes,
    };
    const probe = await mount([columns], { preview: { renderer, input: previewInput } });

    const frame = await vi.waitFor(() => find('iframe[data-slot=email-preview]') as HTMLIFrameElement);
    const blocks = exportedOf(probe.editor);
    const laneIds = (blocks[0].lanes ?? []).flat().map(({ id, key }) => [id, key !== '']);
    expect(laneIds).toEqual([
      [null, true],
      [null, true],
    ]);
    const expected = renderer.render({ ...previewInput, ...sampled, blocks: withIds(blocks) });
    expect(frame.srcdoc).toBe(expected.html);
    expect(expected.problems.length).toBeGreaterThan(0);
    // In words, at the place of its block in the document: the columns, Left, then Right.
    expect(find('[data-slot=email-preview-problems]').textContent).toContain(
      `${RENDER_PROBLEM_MESSAGES['variable-missing']}: {{nobody}} (block 3)`,
    );
    expect(find('[data-slot=email-preview-problems]').textContent).not.toContain('variable-missing');
  });

  it('lists two render problems that read the same as two lines', async () => {
    const renderer = createEmailRenderer({ theme });
    const footer = ['f1', 'f2'].map((id) => ({
      id,
      type: 'paragraph',
      attributes: {},
      content: { text: '{{unsub}}' },
    }));
    const input = { ...previewInput, regions: { footer: { blocks: footer, variables: {}, variableTypes: {} } } };
    const errors = vi.spyOn(console, 'error');
    await mount([paragraph('Hello', 'p1')], { preview: { renderer, input } });

    const line = `${RENDER_PROBLEM_MESSAGES['variable-missing']}: {{unsub}} (in the footer)`;
    await vi.waitFor(() => {
      const lines = [...find('[data-slot=email-preview-problems]').querySelectorAll('li')].map((li) => li.textContent);
      expect(lines).toEqual([line, line]);
    });
    expect(errors.mock.calls.flat().join(' ')).not.toContain('same key');
    errors.mockRestore();
  });

  it('validates a bounded number of times under a host that re-renders on each report', async () => {
    let calls = 0;
    const renderer = createEmailRenderer({ theme });
    function Restless() {
      const [, setProblems] = useState<ProfileProblem[]>([]);
      return (
        <EmailEditor
          profile={emailProfile({ variables: declared })}
          value={[paragraph('', 'p1')]}
          renderer={renderer}
          previewInput={{ subject: 'Hello', preheader: null, locale: 'vi', layoutProps }}
          onValidate={(problems) => {
            calls += 1;
            setProblems(problems);
          }}
        />
      );
    }
    await render(<Restless />);
    await vi.waitFor(() => expect(calls).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(calls).toBe(1);
  });

  it('keeps the caret when the host assigns ids after a save', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Enter}More');
    const added = await vi.waitFor(() => {
      const block = last(probe.reported)?.[1];
      expect(block?.content).toEqual({ text: 'More' });
      return block as EditorEmailBlock;
    });

    await caretAfter('Hello');
    await userEvent.keyboard('{Home}{ArrowRight}{ArrowRight}');

    expect(probe.editor.run('assignBlockIds', { ids: { [added.key]: 'p2' } })).toBe(true);
    await vi.waitFor(() => expect(last(probe.reported)?.map(({ id }) => id)).toEqual(['p1', 'p2']));
    await userEvent.keyboard('!');

    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ text: 'He!llo' }));
  });
});
