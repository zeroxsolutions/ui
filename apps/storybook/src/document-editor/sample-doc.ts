import type { DocJSON } from '@zeroxsolutions/editor/document/core/index';

/** A representative document exercised by the editor + viewer stories. */
export const sampleDoc: DocJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Product spec' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'A Notion-like editor with the ' },
        { type: 'text', text: 'engine fully hidden', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' behind a ' },
        {
          type: 'text',
          text: 'stable façade',
          marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
        },
        { type: 'text', text: '. Press ' },
        { type: 'text', text: '/', marks: [{ type: 'code' }] },
        { type: 'text', text: ' for commands.' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: "Why it's different" }],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'The engine is swappable; your document JSON is the contract.',
            },
          ],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { variant: 'info' },
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'JSON is the source of truth.' }] },
      ],
    },
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Highlights' }] },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Type ' },
                { type: 'text', text: '/', marks: [{ type: 'code' }] },
                { type: 'text', text: ' for the slash menu' },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Select text for the ' },
                { type: 'text', text: 'bubble menu', marks: [{ type: 'highlight' }] },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prose typography' }] }],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ship it' }] }],
        },
      ],
    },
    {
      type: 'callout',
      attrs: { variant: 'success' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'All gates green.' }] }],
    },
  ],
};

/** A richer document adding the heavier feature blocks. */
export const featureBlocksDoc: DocJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Feature blocks' }] },
    {
      type: 'callout',
      attrs: { variant: 'warning' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Callout with a themed palette.' }] }],
    },
    {
      type: 'toggle',
      attrs: { open: true },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A collapsible toggle body.' }] }],
    },
    {
      type: 'codeBlock',
      attrs: {
        language: 'ts',
        code: [
          "import { createClient } from './client';",
          '',
          'export async function activeItems(limit = 10) {',
          '  const client = createClient({ retries: 3 });',
          '  const items = await client.list({ limit });',
          '  return items.filter((item) => item.active);',
          '}',
        ].join('\n'),
      },
    },
    { type: 'mathBlock', attrs: { latex: 'E = mc^2' } },
    { type: 'mermaid', attrs: { source: 'graph TD;\n  A-->B;' } },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lazy' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mermaid' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'yes' }] }] },
          ],
        },
      ],
    },
  ],
};
