import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeViewProps,
} from '../../document/core/index.js';
import type { TriggerOption } from './trigger-token.js';

/**
 * The one factory that generates an inline pill token - the `NodeSpec` + the
 * four-way `NodeCodec` + the commit/read wiring - so a pill-bearing trigger
 * (`/command`, `#channel`) needs no hand-written node. It replaces the per-token
 * copies (the old `command-node.tsx` mirrored `mention()` line for line); one
 * generated node serves both the editable input and the read-only message view,
 * so the two surfaces cannot drift.
 *
 * The node stores a uniform `{ id, label, slug }`. The pill reads `char` plus
 * either the label (a `reference` pill: `@Alice`, `#general`) or the slug (an
 * `invocation` pill: `/image-gen`), per `display`. Markdown export is the honest
 * literal token; Markdown import declines (no reconstruction from prose).
 */
const inlineTokenAttrs = z.object({
  id: z.string().default(''),
  label: z.string().default(''),
  slug: z.string().default(''),
});
export type InlineTokenAttrs = z.infer<typeof inlineTokenAttrs>;

/** Which stored field the pill renders after the trigger char. */
export type InlineTokenDisplay = 'label' | 'slug';

/** The declaration a caller gives the factory; `kind` doubles as the node type. */
export interface InlineTokenSpec {
  /** The token kind and the document node type name. */
  kind: string;
  /** The trigger character shown as the pill's prefix. */
  char: string;
  /** Whether the pill reads its label or its slug after the char. */
  display: InlineTokenDisplay;
  /** Optional extra class on the pill (the accent is applied by scoped CSS). */
  accentClass?: string;
}

/** What the factory returns: a feature to compose into the editor + codec
 *  registry, plus the commit/read wiring a `TriggerToken` needs. */
export interface InlineToken {
  /** The node + codec feature, composed into the editor and the codec registry. */
  feature: EditorFeature;
  /** The document node type (equals `kind`). */
  nodeName: string;
  /** The node's codec (also carried by `feature`), for a registry that wants it
   *  directly. */
  codec: NodeCodec;
  /** Commit a chosen option as this pill at the caret (the menu has already
   *  removed the typed `char query`). */
  insert(editor: IEditor, option: TriggerOption): void;
  /** Read the uniform `{ id, label, slug }` back from a committed node. */
  readRef(attrs: Record<string, unknown>): InlineTokenAttrs;
}

/** Minimal HTML escape for the codec's string output (attribute + text). */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** The literal token text a pill displays - `char` + label or slug, falling
 *  back to the id so an unresolved token still renders something. */
function tokenText(
  spec: InlineTokenSpec,
  attrs: { label?: string; slug?: string; id?: string },
): string {
  const value =
    spec.display === 'slug'
      ? attrs.slug || attrs.id || ''
      : attrs.label || attrs.id || '';
  return `${spec.char}${value}`;
}

export function inlineToken(spec: InlineTokenSpec): InlineToken {
  const { kind } = spec;

  function TokenPill({
    attrs,
    contentEditable,
  }: {
    attrs: InlineTokenAttrs;
    contentEditable?: boolean;
  }) {
    return (
      <span
        data-slot={kind}
        data-token-kind={kind}
        data-token-id={attrs.id}
        contentEditable={contentEditable}
        className={[
          'inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary',
          spec.accentClass,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {tokenText(spec, attrs)}
      </span>
    );
  }

  function TokenView({ attrs }: NodeViewProps<InlineTokenAttrs>) {
    // Inline atom: a static pill, no editable content slot, no engine.
    return <TokenPill attrs={attrs} contentEditable={false} />;
  }

  const codec: NodeCodec<InlineTokenAttrs> = {
    node: kind,
    toMarkdown: (node) => tokenText(spec, node.attrs ?? {}),
    toHTML: (node) => {
      const attrs = node.attrs ?? { id: '', label: '', slug: '' };
      return `<span data-token-kind="${escapeHtml(kind)}" data-token-id="${escapeHtml(attrs.id)}" data-token-label="${escapeHtml(attrs.label)}" data-token-slug="${escapeHtml(attrs.slug)}">${escapeHtml(tokenText(spec, attrs))}</span>`;
    },
    toReact: (node) => (
      <TokenPill attrs={node.attrs ?? { id: '', label: '', slug: '' }} />
    ),
    fromHTML: (element) => {
      if (element.getAttribute('data-token-kind') !== kind) return null;
      return {
        type: kind,
        attrs: {
          id: element.getAttribute('data-token-id') ?? '',
          label: element.getAttribute('data-token-label') ?? '',
          slug: element.getAttribute('data-token-slug') ?? '',
        },
      };
    },
    // A pill is never reconstructed from arbitrary prose Markdown.
    fromMarkdown: () => null,
  };

  const feature = defineFeature({
    id: `inline-token:${kind}`,
    nodes: [
      {
        name: kind,
        group: 'inline',
        atom: true,
        selectable: true,
        attrs: inlineTokenAttrs,
        render: TokenView,
      },
    ],
    codecs: [codec as NodeCodec],
  });

  return {
    feature,
    nodeName: kind,
    codec: codec as NodeCodec,
    insert: (editor, option) =>
      editor.run('insertContent', {
        content: {
          type: kind,
          attrs: {
            id: option.id,
            label: option.label,
            slug: option.slug ?? option.id,
          },
        },
      }),
    readRef: (attrs) => ({
      id: String(attrs.id ?? ''),
      label: String(attrs.label ?? ''),
      slug: String(attrs.slug ?? ''),
    }),
  };
}
