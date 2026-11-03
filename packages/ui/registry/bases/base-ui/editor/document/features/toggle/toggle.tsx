import { ChevronRight } from 'lucide-react';
import { z } from 'zod';
import type { ReactNode } from 'react';
import { defineFeature, type EditorFeature, type NodeCodec } from '@zeroxsolutions/editor-core/document/core/index';
import type { NodeJSON, NodeViewProps, SerializeContext } from '@zeroxsolutions/editor-core/document/core/index';
import type { ReactNodeCodec } from '../../../react-types';
import { cn } from '@/registry/bases/base-ui/lib/utils';

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
    // Notion layout: the ▸ marker sits in the left gutter, inline with the first
    // body line — a flex row (`items-start`) puts the fixed-width chevron beside
    // the flowing body instead of stranding it on a line of its own above.
    <div className="my-2 flex items-start gap-1" data-slot="toggle" data-open={attrs.open}>
      {/* `contentEditable={false}` keeps typed text out of the disclosure marker. */}
      <span
        role="button"
        aria-label={attrs.open ? 'Collapse' : 'Expand'}
        aria-expanded={attrs.open}
        contentEditable={false}
        onClick={() => updateAttrs({ open: !attrs.open })}
        className="text-muted-foreground hover:bg-accent mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md select-none"
      >
        <span aria-hidden className={cn('inline-block leading-none transition-transform', attrs.open && 'rotate-90')}>
          ▸
        </span>
      </span>
      <div className={cn('min-w-0 flex-1', attrs.open ? 'block' : 'hidden')}>{children as ReactNode}</div>
    </div>
  );
}

/** The shared `<details>` string — HTML export and Markdown export are identical
 *  (GitHub renders a raw `<details>` block), so the round-trip stays honest. */
const detailsHtml = (node: NodeJSON<ToggleAttrs>, ctx: SerializeContext): string => {
  const open = node.attrs?.open ?? true;
  return `<details${open ? ' open' : ''}>${ctx.serializeChildren(node as never)}</details>`;
};

const toggleCodec: ReactNodeCodec<ToggleAttrs> = {
  node: 'toggle',
  toHTML: (node, ctx) => detailsHtml(node, ctx),
  toMarkdown: (node, ctx) => detailsHtml(node, ctx),
  toReact: (node, ctx) => (
    // Notion layout, static twin of `ToggleView`: `display:flex` on the
    // `<details>` seats the ▸ marker (the `<summary>`) inline with the first body
    // line. The browser still hides the non-summary flex item when closed, so the
    // native open/close keeps working with zero JS.
    <details data-slot="toggle" className="group my-2 flex items-start gap-1" open={node.attrs?.open ?? true}>
      <summary className="text-muted-foreground hover:bg-accent mt-0.5 flex size-6 shrink-0 cursor-pointer list-none items-center justify-center rounded-md select-none [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block leading-none transition-transform group-open:rotate-90">
          ▸
        </span>
      </summary>
      <div className="min-w-0 flex-1">{ctx.renderChildren(node as never)}</div>
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
        icon: <ChevronRight className="size-4" />,
        title: 'Toggle',
        description: 'Collapsible section',
        group: 'Blocks',
        keywords: ['toggle', 'collapse', 'details', 'fold'],
        command: 'insertToggle',
      },
    ],
  });
}
