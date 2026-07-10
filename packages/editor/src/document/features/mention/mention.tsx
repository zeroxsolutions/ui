import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '../../core/index.js';
import type { NodeViewProps } from '../../core/index.js';

/**
 * An inline `@user` mention — an inline **atom** node rendered as a subtle,
 * non-editable pill, with a two-way HTML codec (`<span data-mention-id>`).
 * Markdown has no mention primitive, so Markdown export is the honest-but-lossy
 * `@label` text and Markdown import declines (we don't parse `@name` out of
 * prose). Engine-free, mirroring the `callout`/`toggle` worked examples:
 * declarative `NodeSpec` + `render` + `NodeCodec` + command. (Inline flow comes
 * from `group: 'inline'`; the compiler derives the engine's `inline` flag.)
 */
const mentionAttrs = z.object({
  id: z.string().default(''),
  label: z.string().default(''),
});
type MentionAttrs = z.infer<typeof mentionAttrs>;

/** Minimal HTML escape for the codec's string output (attribute + text). */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * The inline pill — a rounded chip on the design-system `primary` token that
 * reads as one unit. Shared by the editable node view and the static `toReact`
 * codec so both surfaces render identically.
 */
function MentionPill({
  id,
  label,
  contentEditable,
}: {
  id: string;
  label: string;
  contentEditable?: boolean;
}) {
  return (
    <span
      data-slot="mention"
      data-mention-id={id}
      contentEditable={contentEditable}
      className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary"
    >
      @{label || id}
    </span>
  );
}

function MentionView({ attrs }: NodeViewProps<MentionAttrs>) {
  // Inline atom: no editable content slot, no engine — a static pill. The label
  // falls back to the id so an unresolved mention still renders something.
  return <MentionPill id={attrs.id} label={attrs.label} contentEditable={false} />;
}

const mentionCodec: NodeCodec<MentionAttrs> = {
  node: 'mention',
  // Markdown has no mention primitive → the honest-but-lossy `@label` text.
  toMarkdown: (node) => `@${node.attrs?.label ?? ''}`,
  toHTML: (node) => {
    const id = node.attrs?.id ?? '';
    const label = node.attrs?.label ?? '';
    return `<span data-mention-id="${escapeHtml(id)}">@${escapeHtml(label)}</span>`;
  },
  toReact: (node) => {
    const attrs = node.attrs ?? { id: '', label: '' };
    return <MentionPill id={attrs.id} label={attrs.label} />;
  },
  fromHTML: (element) => {
    if (!element.getAttribute('data-mention-id')) return null;
    return {
      type: 'mention',
      attrs: {
        id: element.getAttribute('data-mention-id') ?? '',
        label: (element.textContent ?? '').replace(/^@/, ''),
      },
    };
  },
  // We deliberately don't reconstruct `@name` from prose Markdown.
  fromMarkdown: () => null,
};

export function mention(): EditorFeature {
  return defineFeature({
    id: 'mention',
    nodes: [
      {
        name: 'mention',
        group: 'inline',
        atom: true,
        selectable: true,
        attrs: mentionAttrs,
        render: MentionView,
      },
    ],
    codecs: [mentionCodec as NodeCodec],
    commands: {
      // `id`/`label` are required — a mention needs an identity, so an insert
      // without one is rejected at the dispatch boundary before any mutation.
      insertMention: {
        args: z.object({ id: z.string(), label: z.string() }),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'mention',
              attrs: { id: args.id, label: args.label },
            },
          }),
      },
    },
    // No slash item: mentions are triggered by typing `@` (chrome, out of scope
    // here), not the insert menu.
  });
}
