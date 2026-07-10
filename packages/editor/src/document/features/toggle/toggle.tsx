import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '../../core/index.js';
import type { NodeJSON, NodeViewProps, SerializeContext } from '../../core/index.js';

/**
 * A toggle block — a collapsible/details section (like Notion's toggle or the
 * HTML `<details>`/`<summary>` element). A custom node with a React node view
 * whose disclosure marker flips the `open` attribute, and a two-way codec that
 * round-trips through HTML `<details>` semantics (the one unambiguous path;
 * Markdown reuses the same raw `<details>` block, which GitHub renders). Serves
 * as a worked example alongside `callout` for a stateful custom node-view
 * feature: declarative `NodeSpec` + `render` + `NodeCodec` + slash, all
 * engine-free.
 */
const toggleAttrs = z.object({
  open: z.boolean().default(true),
});
type ToggleAttrs = z.infer<typeof toggleAttrs>;

function ToggleView({ attrs, updateAttrs, children }: NodeViewProps<ToggleAttrs>) {
  return (
    <div
      className="zerox-toggle"
      data-open={attrs.open}
      style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}
    >
      {/* `contentEditable={false}` keeps typed text out of the disclosure marker. */}
      <span
        role="button"
        aria-label={attrs.open ? 'Collapse' : 'Expand'}
        aria-expanded={attrs.open}
        contentEditable={false}
        onClick={() => updateAttrs({ open: !attrs.open })}
        style={{
          cursor: 'pointer',
          userSelect: 'none',
          display: 'inline-block',
          lineHeight: 1.5,
          transition: 'transform 0.15s ease',
          transform: attrs.open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      >
        ▸
      </span>
      <div style={{ flex: 1, display: attrs.open ? 'block' : 'none' }}>{children}</div>
    </div>
  );
}

/** The shared `<details>` string — HTML export and Markdown export are identical
 *  (GitHub renders a raw `<details>` block), so the round-trip stays honest. */
const detailsHtml = (node: NodeJSON<ToggleAttrs>, ctx: SerializeContext): string => {
  const open = node.attrs?.open ?? true;
  return `<details${open ? ' open' : ''}>${ctx.serializeChildren(node as never)}</details>`;
};

const toggleCodec: NodeCodec<ToggleAttrs> = {
  node: 'toggle',
  toHTML: (node, ctx) => detailsHtml(node, ctx),
  toMarkdown: (node, ctx) => detailsHtml(node, ctx),
  toReact: (node, ctx) => (
    <details open={node.attrs?.open ?? true}>{ctx.renderChildren(node as never)}</details>
  ),
  // Markdown has no native toggle: remark surfaces a raw `<details>` block as an
  // `html` token, so HTML import is the two-way path — never parse it here.
  fromMarkdown: () => null,
  fromHTML: (element, ctx) => {
    if (element.tagName !== 'DETAILS') return null;
    return {
      type: 'toggle',
      attrs: { open: element.hasAttribute('open') },
      content: ctx.fromHTMLChildren(element),
    };
  },
};

export function toggle(): EditorFeature {
  return defineFeature({
    id: 'toggle',
    nodes: [
      {
        name: 'toggle',
        group: 'block',
        content: 'block+',
        defining: true,
        attrs: toggleAttrs,
        render: ToggleView,
      },
    ],
    codecs: [toggleCodec as NodeCodec],
    commands: {
      insertToggle: {
        run: (editor) =>
          editor.run('insertContent', {
            content: {
              type: 'toggle',
              attrs: { open: true },
              content: [{ type: 'paragraph' }],
            },
          }),
      },
    },
    slash: [
      {
        id: 'toggle',
        title: 'Toggle',
        description: 'Collapsible section',
        group: 'Blocks',
        keywords: ['toggle', 'collapse', 'details', 'fold'],
        command: 'insertToggle',
      },
    ],
  });
}
