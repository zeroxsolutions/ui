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
        { type: 'text', text: ' behind a stable façade.' },
      ],
    },
    {
      type: 'callout',
      attrs: { variant: 'info' },
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'JSON is the source of truth.' }] },
      ],
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Type / for the slash menu' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select text for the bubble menu' }] }] },
      ],
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
    { type: 'codeBlock', attrs: { language: 'ts', code: 'export const x = 1;' } },
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
