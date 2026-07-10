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
    <div className="my-2" data-slot="toggle" data-open={attrs.open}>
      {/* `contentEditable={false}` keeps typed text out of the disclosure marker. */}
      <span
        role="button"
        aria-label={attrs.open ? 'Collapse' : 'Expand'}
        aria-expanded={attrs.open}
        contentEditable={false}
        onClick={() => updateAttrs({ open: !attrs.open })}
        className="flex cursor-pointer select-none items-center gap-2 rounded-md py-1 font-medium hover:bg-accent"
      >
        <span
          aria-hidden
          className={`inline-block leading-none text-muted-foreground transition-transform ${
            attrs.open ? 'rotate-90' : ''
          }`}
        >
          ▸
        </span>
      </span>
      <div className={`pl-6 [&>:first-child]:mt-0 ${attrs.open ? 'block' : 'hidden'}`}>
        {children}
      </div>
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
    <details
      className="group my-2 [&>:not(summary)]:pl-6 [&>summary+*]:mt-0"
      open={node.attrs?.open ?? true}
    >
      <summary className="flex list-none cursor-pointer select-none items-center gap-2 rounded-md py-1 font-medium hover:bg-accent [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-block leading-none text-muted-foreground transition-transform group-open:rotate-90"
        >
          ▸
        </span>
      </summary>
      {ctx.renderChildren(node as never)}
    </details>
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
