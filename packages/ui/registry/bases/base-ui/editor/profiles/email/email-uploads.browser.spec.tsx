import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { emailProfile, type EditorEmailBlock } from '@zeroxsolutions/editor-core/profiles/index';
import {
  createEmailRenderer,
  defineEmailBlock,
  imageUrl,
  plainText,
  type EmailTheme,
  type RenderEmailInput,
} from '@zeroxsolutions/editor-core/template/email/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { findElement } from '../../../../../../src/test/document-editor';
import {
  dropFiles,
  fileInput,
  heldUpload,
  pasteFiles,
  pngFile,
  type HeldUploadCall,
} from '../../../../../../src/test/uploads';
import type { EditorUpload } from '../../document/uploads/upload';
import { EmailEditor } from './email-editor';

const banner = defineEmailBlock({
  type: 'banner',
  label: 'Banner',
  fields: { picture: imageUrl({ label: 'Picture' }), note: plainText() },
  render: (_view, h) => h.divider(),
  sample: { fields: { picture: 'https://i.test/b.png', note: 'x' }, variableTypes: {} },
});

const profile = emailProfile({ variables: [], blocks: [banner] });

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

const block = (type: string, content: Record<string, unknown>, id = type): EditorEmailBlock => ({
  id,
  key: id,
  type,
  attributes: {},
  content,
});

const text = block('paragraph', { text: 'Hello' }, 'p1');
const imageBlock = block('image', { src: 'https://i.test/old.png', alt: 'Bay' }, 'i1');
const hero = block('hero', {
  image: '',
  alt: 'Bay',
  heading: 'Welcome',
  text: 'Your stay',
  buttonLabel: '',
  buttonHref: '',
});
const social = block('socialLinks', { links: [{ label: 'Site', icon: '', href: 'https://x.test' }] });
const productBlock = block('banner', { picture: '', note: 'Sale' });

interface Probe {
  editor: IEditor | null;
  reported: EditorEmailBlock[][];
}

function Host({ initial, probe, upload }: { initial: EditorEmailBlock[]; probe: Probe; upload?: EditorUpload }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="style-nova p-12">
      <EmailEditor
        label="Body"
        profile={profile}
        blocks={[banner]}
        value={value}
        upload={upload}
        onChange={(blocks) => {
          probe.reported.push(blocks);
          setValue(blocks);
        }}
        onReady={(editor) => (probe.editor = editor)}
      />
    </div>
  );
}

async function mount(initial: EditorEmailBlock[], upload?: EditorUpload): Promise<Probe> {
  const probe: Probe = { editor: null, reported: [] };
  await render(<Host initial={initial} probe={probe} upload={upload} />);
  await vi.waitFor(() => {
    if (!probe.editor) throw new Error('the editor is not ready');
  });
  return probe;
}

const last = <T,>(list: T[]): T | undefined => list[list.length - 1];
const contentOf = (probe: Probe, type: string) => last(probe.reported)?.find((entry) => entry.type === type)?.content;

/** The blocks a render takes, a key standing in for each missing id. */
function withIds(blocks: readonly EditorEmailBlock[]): RenderEmailInput<unknown>['blocks'] {
  return blocks.map(({ lanes, ...entry }) => ({
    ...entry,
    id: entry.id ?? entry.key,
    ...(lanes ? { lanes: lanes.map(withIds) } : {}),
  }));
}

/** Everything the editor handed out: each report, and the email the last one renders to. */
function handedOut(probe: Probe): string {
  const blocks = withIds(last(probe.reported) ?? []);
  const rendered = createEmailRenderer({ theme }).render({
    subject: 'Hi',
    preheader: null,
    locale: 'en',
    layoutProps: { logo: { url: 'https://i.test/logo.png', alt: 'Logo', width: 120 }, footer: ['Example'] },
    blocks,
    variables: {},
    variableTypes: {},
  });
  return JSON.stringify(probe.reported) + rendered.html;
}

async function waitForCalls(calls: HeldUploadCall[], count: number): Promise<void> {
  await vi.waitFor(() => expect(calls).toHaveLength(count));
}

describe('uploads in the email editor', () => {
  it('takes an address only when the host gives no upload', async () => {
    await mount([hero]);

    await userEvent.click(page.getByRole('button', { name: 'Image', exact: true }));

    await expect.element(page.getByRole('textbox', { name: 'Image', exact: true })).toBeVisible();
    expect(document.querySelector('[data-slot=upload-tabs]')).toBeNull();
  });

  it("uploads a hero's image, and never hands out the local file while it uploads", async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([text, hero], upload);
    await userEvent.click(page.getByRole('button', { name: 'Image', exact: true }));

    await userEvent.upload(fileInput(), pngFile());
    await waitForCalls(calls, 1);
    expect((await findElement('[data-slot=card-image]')).getAttribute('src')).toMatch(/^blob:/);
    await userEvent.click(await findElement('.ProseMirror p', 'Hello'));
    await userEvent.keyboard('{End}!');
    await vi.waitFor(() => expect(probe.reported.length).toBeGreaterThan(0));
    expect(handedOut(probe)).not.toMatch(/blob:|data:/);

    calls[0].answer('https://i.test/hero.png');

    await vi.waitFor(() => expect(contentOf(probe, 'hero')).toMatchObject({ image: 'https://i.test/hero.png' }));
    expect(handedOut(probe)).not.toMatch(/blob:|data:/);
  });

  it('refuses an http address the upload answers for a hero, with the error a typed one gets', async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([hero], upload);
    await userEvent.click(page.getByRole('button', { name: 'Image', exact: true }));
    await userEvent.upload(fileInput(), pngFile());
    await waitForCalls(calls, 1);

    calls[0].answer('http://i.test/hero.png');

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('The image must load from https:// or a link variable');
    expect(JSON.stringify(probe.reported)).not.toContain('http://i.test/hero.png');
  });

  it("uploads the image block's image from its Upload tab", async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([imageBlock], upload);
    await userEvent.click(page.getByRole('button', { name: 'Edit' }));
    await userEvent.click(page.getByRole('tab', { name: 'Upload' }));

    await userEvent.upload(fileInput(), pngFile());
    await waitForCalls(calls, 1);
    calls[0].answer('https://i.test/new.png');

    await vi.waitFor(() => expect(contentOf(probe, 'image')).toMatchObject({ src: 'https://i.test/new.png' }));
  });

  it("uploads a social link's icon into its own item", async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([social], upload);
    await userEvent.click(page.getByRole('button', { name: 'Site' }));

    await userEvent.upload(fileInput(), pngFile('site.png'));
    await waitForCalls(calls, 1);
    calls[0].answer('https://i.test/site.png');

    await vi.waitFor(() =>
      expect(contentOf(probe, 'socialLinks')).toEqual({
        links: [{ label: 'Site', icon: 'https://i.test/site.png', href: 'https://x.test' }],
      }),
    );
  });

  it("uploads a product block's image field", async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([productBlock], upload);
    await userEvent.click(page.getByRole('button', { name: 'Picture' }));

    await userEvent.upload(fileInput(), pngFile());
    await waitForCalls(calls, 1);
    calls[0].answer('http://i.test/banner.png');

    await vi.waitFor(() => expect(contentOf(probe, 'banner')).toMatchObject({ picture: 'http://i.test/banner.png' }));
  });

  it('turns a pasted image file into an image block, and a pasted document into nothing', async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([text], upload);
    await userEvent.click(await findElement('.ProseMirror p', 'Hello'));

    pasteFiles(await findElement('.ProseMirror'), [new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' })]);
    pasteFiles(await findElement('.ProseMirror'), [pngFile()]);
    await waitForCalls(calls, 1);
    calls[0].answer('https://i.test/pasted.png');

    await vi.waitFor(() => expect(contentOf(probe, 'image')).toMatchObject({ src: 'https://i.test/pasted.png' }));
    expect(calls.map((call) => call.file.name)).toEqual(['cat.png']);
    expect(JSON.stringify(probe.reported)).not.toMatch(/blob:/);
  });

  it('turns a dropped image file into an image block that uploads', async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([text], upload);

    dropFiles(await findElement('.ProseMirror p', 'Hello'), [pngFile('drop.png')]);
    await waitForCalls(calls, 1);
    calls[0].answer('https://i.test/drop.png');

    await vi.waitFor(() => expect(contentOf(probe, 'image')).toMatchObject({ src: 'https://i.test/drop.png' }));
  });

  it('keeps a social icon uploading in its own link when another link before it is removed', async () => {
    const { upload, calls } = heldUpload();
    const two = block('socialLinks', {
      links: [
        { label: 'Site', icon: '', href: 'https://x.test' },
        { label: 'Blog', icon: '', href: 'https://blog.test' },
      ],
    });
    const probe = await mount([two], upload);
    await userEvent.click(page.getByRole('button', { name: 'Blog' }));
    await userEvent.upload(fileInput(), pngFile('blog.png'));
    await waitForCalls(calls, 1);
    await userEvent.keyboard('{Escape}');

    await userEvent.click(page.getByRole('button', { name: 'Site' }));
    await userEvent.click(page.getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => expect((contentOf(probe, 'socialLinks') as { links: unknown[] }).links).toHaveLength(1));
    calls[0].answer('https://i.test/blog.png');

    await vi.waitFor(() =>
      expect(contentOf(probe, 'socialLinks')).toEqual({
        links: [{ label: 'Blog', icon: 'https://i.test/blog.png', href: 'https://blog.test' }],
      }),
    );
    expect(calls[0].signal.aborted).toBe(false);
  });

  it('ends a social icon upload whose link an undo takes away', async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([text, social], upload);
    await userEvent.click(page.getByRole('button', { name: 'Add to Links' }));
    await userEvent.click(page.getByRole('tab', { name: 'Upload' }));
    await userEvent.upload(fileInput(), pngFile('new.png'));
    await waitForCalls(calls, 1);
    await userEvent.keyboard('{Escape}');

    await userEvent.click(await findElement('.ProseMirror p', 'Hello'));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');

    await vi.waitFor(() => expect((contentOf(probe, 'socialLinks') as { links: unknown[] }).links).toHaveLength(1));
    await vi.waitFor(() => expect(calls[0].signal.aborted).toBe(true));
    expect((contentOf(probe, 'socialLinks') as { links: unknown[] }).links).toHaveLength(1);
  });

  it("ends a product image's upload when the author removes the image", async () => {
    const { upload, calls } = heldUpload();
    const probe = await mount([block('banner', { picture: 'https://i.test/b.png', note: 'Sale' })], upload);
    await userEvent.click(page.getByRole('button', { name: 'Picture' }));
    await userEvent.click(page.getByRole('tab', { name: 'Upload' }));
    await userEvent.upload(fileInput(), pngFile());
    await waitForCalls(calls, 1);

    await userEvent.click(page.getByRole('button', { name: 'Picture' }));
    await userEvent.click(page.getByRole('button', { name: 'Remove' }));
    calls[0].answer('https://i.test/uploaded.png');

    await vi.waitFor(() => expect(calls[0].signal.aborted).toBe(true));
    await vi.waitFor(() => expect(contentOf(probe, 'banner')).toMatchObject({ picture: '' }));
  });
});
