import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { emailProfile, type EditorEmailBlock } from '@zeroxsolutions/editor-core/profiles/index';
import { createEmailRenderer, type EmailTheme } from '@zeroxsolutions/editor-core/template/email/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { DEFAULT_LAYOUT_WORDS } from '../../../document/layout/layout-words';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../../messages';
import { EmailEditor, type EmailPreviewInput } from '../email-editor';

const profile = emailProfile({ variables: [] });

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

const previewInput = {
  subject: 'Hello',
  preheader: null,
  locale: 'en',
  layoutProps: { logo: { url: 'https://cdn.example.test/logo@2x.png', alt: 'Example', width: 120 }, footer: ['Ex'] },
} satisfies EmailPreviewInput;

/** Layout words of another catalogue, so a name drawn from the English would show. */
const messages: Partial<ProfileEditorMessages> = {
  layout: {
    ...DEFAULT_LAYOUT_WORDS,
    toolbar: 'Mise en page',
    sectionWidth: 'Largeur',
    sectionWidths: { content: 'Contenu', wide: 'Large', full: 'Pleine' },
  },
};

function block(overrides: Partial<EditorEmailBlock> & Pick<EditorEmailBlock, 'type'>): EditorEmailBlock {
  return { id: null, key: '', attributes: {}, content: {}, ...overrides };
}
const paragraph = (text: string) => block({ type: 'paragraph', content: { text } });

interface Probe {
  editor: IEditor | null;
  value: EditorEmailBlock[];
}

function Host({ initial, probe }: { initial: EditorEmailBlock[]; probe: Probe }) {
  const [value, setValue] = useState(initial);
  const [renderer] = useState(() => createEmailRenderer({ theme }));
  return (
    <div className="style-nova p-12">
      <EmailEditor
        label="Body"
        profile={profile}
        messages={messages}
        value={value}
        renderer={renderer}
        previewInput={previewInput}
        onChange={(blocks) => {
          probe.value = blocks;
          setValue(blocks);
        }}
        onReady={(editor) => (probe.editor = editor)}
      />
    </div>
  );
}

async function mount(initial: EditorEmailBlock[]): Promise<Probe & { editor: IEditor }> {
  const probe: Probe = { editor: null, value: initial };
  await render(<Host initial={initial} probe={probe} />);
  await vi.waitFor(() => {
    if (!probe.editor) throw new Error('the editor is not ready');
  });
  return probe as Probe & { editor: IEditor };
}

function find(selector: string, text?: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => text === undefined || element.textContent === text,
  );
  if (!found) throw new Error(`nothing matches ${selector}${text ? ` holding "${text}"` : ''}`);
  return found;
}

const slashTitles = () =>
  [...document.querySelectorAll('[data-slot=slash-menu] [data-slot=item-title]')].map((title) => title.textContent);

const toolbar = () => page.getByRole('toolbar', { name: 'Mise en page' });

describe('the section in the email editor', () => {
  it('inserts from the slash menu and sends a section holding the line typed in it', async () => {
    const probe = await mount([paragraph('')]);
    await userEvent.click(find('[contenteditable=true] p'));
    await userEvent.keyboard('/');
    await userEvent.click(
      await vi.waitFor(() =>
        find('[data-slot=slash-menu] [data-slot=item-title]', DEFAULT_PROFILE_MESSAGES.blocks.section.title),
      ),
    );
    await userEvent.keyboard('Inside');

    await vi.waitFor(() =>
      expect(probe.value).toMatchObject([
        { type: 'section', lanes: [[{ type: 'paragraph', content: { text: 'Inside' } }]] },
      ]),
    );
  });

  it('offers content and wide, never full, and sends the width set', async () => {
    const probe = await mount([block({ type: 'section', lanes: [[paragraph('Inside')]] })]);
    await userEvent.click(find('[contenteditable=true] p', 'Inside'));
    await expect.element(toolbar()).toBeVisible();

    const widths = toolbar().getByRole('group', { name: 'Largeur' }).getByRole('button');
    expect(widths.elements().map((button) => button.textContent)).toEqual(['Contenu', 'Large']);
    expect(probe.editor.can('setSectionLayout', { layout: { width: 'full' } })).toBe(false);

    await userEvent.click(widths.getByText('Large', { exact: true }));
    await vi.waitFor(() => expect(probe.value[0]?.attributes).toMatchObject({ width: 'wide' }));
  });

  it('offers no section in a lane or in a section', async () => {
    const probe = await mount([
      block({ type: 'columns', lanes: [[paragraph('Left')], [paragraph('Right')]] }),
      block({ type: 'section', lanes: [[paragraph('Inside')]] }),
    ]);
    for (const text of ['Left', 'Inside']) {
      await userEvent.click(find('[contenteditable=true] p', text));
      await userEvent.keyboard('{End}');
      expect(probe.editor.can('insertEmailBlock', { kind: 'section' })).toBe(false);
      expect(probe.editor.run('insertEmailBlock', { kind: 'section' })).toBe(false);
    }
    await userEvent.keyboard('{Enter}/');
    await vi.waitFor(() => expect(slashTitles().length).toBeGreaterThan(0));
    expect(slashTitles()).not.toContain(DEFAULT_PROFILE_MESSAGES.blocks.section.title);
  });

  it('draws the section in the preview', async () => {
    await mount([block({ type: 'section', attributes: { background: 'teal' }, lanes: [[paragraph('Inside')]] })]);
    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    const frame = await vi.waitFor(() => find('iframe[data-slot=email-preview]') as HTMLIFrameElement);
    await vi.waitFor(() => expect(frame.srcdoc).toMatch(/class="[^"]*zx-section-bg-teal/));
    expect(frame.srcdoc).toContain('Inside');
  });
});
