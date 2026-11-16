/**
 * The editor docs' sidebar: its sections, each naming its pages by item name, in reading order. The
 * editor zone and registry-ui both draw their Editor section from this one list, so the two sidebars
 * cannot drift apart.
 */
export const editorDocsSections: readonly { title: string; pages: readonly string[] }[] = [
  {
    title: 'Surfaces',
    pages: ['document-editor', 'math-editor', 'mermaid-editor', 'code-editor', 'chat-input'],
  },
  {
    title: 'Features',
    pages: [
      'editor-callout',
      'editor-code-block',
      'editor-embed',
      'editor-image',
      'editor-link',
      'editor-math',
      'editor-mention',
      'editor-mermaid',
      'editor-table',
      'editor-toggle',
      'editor-features',
    ],
  },
  {
    title: 'Libraries',
    pages: ['editor-theme', 'editor-code-mirror'],
  },
];
