/**
 * The editor docs' sidebar: its sections, each naming its pages by item name, in reading order. The
 * editor zone and registry-ui both draw their Editor section from this one list, so the two sidebars
 * cannot drift apart.
 */
export const editorDocsSections: readonly { title: string; pages: readonly string[] }[] = [
  {
    title: 'Surfaces',
    pages: [
      'document-editor',
      'math-editor',
      'mermaid-editor',
      'code-editor',
      'chat-input',
      'email-editor',
      'sms-editor',
    ],
  },
  {
    title: 'Features',
    pages: [
      'block-library',
      'block-presets',
      'editor-bookmark',
      'editor-button',
      'editor-callout',
      'editor-card',
      'editor-code-block',
      'editor-columns',
      'editor-embed',
      'editor-file',
      'editor-image',
      'editor-layout',
      'editor-link',
      'editor-math',
      'editor-media',
      'editor-mention',
      'editor-mermaid',
      'editor-table',
      'editor-table-of-contents',
      'editor-toggle',
      'editor-toggle-heading',
      'editor-uploads',
      'editor-features',
    ],
  },
  {
    title: 'Libraries',
    pages: ['editor-theme', 'editor-code-mirror'],
  },
];
