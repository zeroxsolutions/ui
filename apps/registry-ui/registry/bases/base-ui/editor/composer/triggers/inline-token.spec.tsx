import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type {
  DocJSON,
  IEditor,
  NodeJSON,
} from '@zeroxsolutions/editor-core/document/core/index';
import {
  createCodecRegistry,
  importHTML,
  serialize,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../../document/features/standard/index.js';
import { inlineToken } from './inline-token.js';

const editors: IEditor[] = [];
function build(feature: ReturnType<typeof inlineToken>['feature']): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createEditor()
    .use(standardKit())
    .use(feature)
    .build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

/** DFS for the first node of a type - an inline token nests inside a paragraph. */
function findNode(node: NodeJSON, type: string): NodeJSON | undefined {
  if (node.type === type) return node;
  for (const child of node.content ?? []) {
    const found = findNode(child, type);
    if (found) return found;
  }
  return undefined;
}

const command = inlineToken({ kind: 'command', char: '/', display: 'slug' });
const channel = inlineToken({ kind: 'channel', char: '#', display: 'label' });

const commandRegistry = createCodecRegistry([command.feature]);

const commandDoc = (
  id = 'image',
  slug = 'image-gen',
  label = 'Image',
): DocJSON => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'command', attrs: { id, label, slug } }],
    },
  ],
});

describe('inlineToken - commit', () => {
  it('inserts a pill node from an option via insert()', () => {
    const editor = build(command.feature);
    command.insert(editor, { id: 'image', label: 'Image', slug: 'image-gen' });
    const node = findNode(editor.getJSON(), 'command');
    expect(node?.attrs).toMatchObject({
      id: 'image',
      label: 'Image',
      slug: 'image-gen',
    });
  });

  it('defaults the slug to the id when the option carries none', () => {
    const editor = build(command.feature);
    command.insert(editor, { id: 'code', label: 'Code' });
    expect(findNode(editor.getJSON(), 'command')?.attrs?.slug).toBe('code');
  });

  it('reads the uniform ref back from committed attrs', () => {
    expect(
      command.readRef({ id: 'image', label: 'Image', slug: 'image-gen' }),
    ).toEqual({
      id: 'image',
      label: 'Image',
      slug: 'image-gen',
    });
  });
});

describe('inlineToken - codec round-trip', () => {
  it('exports HTML carrying the kind, id, and /slug text (slug display)', () => {
    const html = serialize(commandDoc(), 'html', commandRegistry);
    expect(html).toContain('data-token-kind="command"');
    expect(html).toContain('data-token-id="image"');
    expect(html).toContain('data-token-slug="image-gen"');
    expect(html).toContain('/image-gen');
  });

  it('exports the honest literal token to Markdown', () => {
    expect(serialize(commandDoc(), 'markdown', commandRegistry)).toContain(
      '/image-gen',
    );
  });

  it('imports a matching span back into the node', () => {
    const result = importHTML(
      '<p><span data-token-kind="command" data-token-id="code" data-token-label="Code" data-token-slug="code">/code</span></p>',
      commandRegistry,
    );
    const node = findNode(result.doc, 'command');
    expect(node?.attrs).toMatchObject({
      id: 'code',
      label: 'Code',
      slug: 'code',
    });
  });

  it('declines a span whose kind does not match', () => {
    const result = importHTML(
      '<p><span data-token-kind="mention" data-token-id="x">@x</span></p>',
      commandRegistry,
    );
    expect(findNode(result.doc, 'command')).toBeUndefined();
  });
});

describe('inlineToken - display mode', () => {
  it('a label-display pill reads the label after the char', () => {
    const channelRegistry = createCodecRegistry([channel.feature]);
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'channel',
              attrs: { id: 'c1', label: 'general', slug: 'general' },
            },
          ],
        },
      ],
    };
    expect(serialize(doc, 'markdown', channelRegistry)).toContain('#general');
  });
});
