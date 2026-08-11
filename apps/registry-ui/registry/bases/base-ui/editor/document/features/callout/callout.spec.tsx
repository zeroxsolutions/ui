import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type {
  DocJSON,
  IEditor,
} from '@zeroxsolutions/editor-core/document/core/index';
import {
  createCodecRegistry,
  importMarkdown,
  serialize,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index.js';
import { callout } from './callout.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(callout());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

// callout is registered before standard so it claims GitHub-alert blockquotes.
const registry = createCodecRegistry([callout(), standardKit()]);

const calloutDoc = (variant = 'warning'): DocJSON => ({
  type: 'doc',
  content: [
    {
      type: 'callout',
      attrs: { variant },
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Heads up' }] },
      ],
    },
  ],
});

describe('callout', () => {
  it('inserts a callout via its command', () => {
    const editor = build();
    expect(editor.run('insertCallout', { variant: 'danger' })).not.toBe(false);
    const node = editor.getJSON().content?.find((n) => n.type === 'callout');
    expect(node?.attrs?.variant).toBe('danger');
  });

  it('round-trips through HTML unambiguously', () => {
    const doc = calloutDoc('success');
    const html = serialize(doc, 'html', registry);
    expect(html).toContain('data-callout="success"');
    expect(html).toContain('Heads up');
  });

  it('exports to the GitHub-alert Markdown dialect', () => {
    const md = serialize(calloutDoc('warning'), 'markdown', registry);
    expect(md).toContain('> [!WARNING]');
    expect(md).toContain('> Heads up');
  });

  it('imports a GitHub-alert blockquote back into a callout', () => {
    const result = importMarkdown('> [!CAUTION]\n> Danger ahead', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('callout');
    expect(node?.attrs?.variant).toBe('danger');
    const text = node?.content?.[0]?.content?.[0]?.text;
    expect(text).toBe('Danger ahead');
  });

  it('leaves a plain blockquote as a blockquote', () => {
    const result = importMarkdown('> just a quote', registry);
    expect(result.doc.content?.[0]?.type).toBe('blockquote');
  });
});
