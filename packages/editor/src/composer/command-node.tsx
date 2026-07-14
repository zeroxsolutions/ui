import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeViewProps,
} from '../document/core/index.js';

/**
 * The inline `/command` token — the Discord-style command pill. Unlike the
 * earlier "mode badge" (a separate surface chip that dropped the `/name`), the
 * command lives **inline in the text** as an atomic node that still reads
 * `/image-gen`: committed when a typed `/query` matches a command (Tab / Enter /
 * space), deletable/re-openable as one unit, and — critically — the **same node**
 * on both surfaces (`ChatInput`'s node view and `ChatMessageView`'s `toReact`
 * codec), so the two can't drift. Engine-free, mirroring `mention()`: a
 * declarative `NodeSpec` + `render` + `NodeCodec` + an insert command. HTML round
 * trips via `data-command-id`; Markdown is the honest `/name` text (no reverse
 * parse of prose into a command).
 */
const commandAttrs = z.object({
  /** The command's stable identity (maps back to the host's command registry). */
  id: z.string().default(''),
  /** The human label shown in the menu (carried for the submit payload). */
  label: z.string().default(''),
  /** The invocation slug shown after `/` in the pill — e.g. `image-gen`. */
  name: z.string().default(''),
});
type CommandAttrs = z.infer<typeof commandAttrs>;

/** Minimal HTML escape for the codec's string output (attribute + text). */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** The literal token a command pill displays — always `/slug`, canonicalised to
 *  the command's `name` (falling back to its `id` when unnamed). */
export function commandToken(attrs: { name?: string; id?: string }): string {
  return `/${attrs.name || attrs.id || ''}`;
}

/**
 * The inline command pill — a rounded chip reading `/name` on the composer accent
 * token. Shared by the editable node view and the static `toReact` codec so both
 * surfaces render identically. Carries no icon: a Discord-style command pill is
 * its `/name`, and a `ReactNode` icon can't survive the JSON codec anyway.
 */
function CommandPill({
  id,
  name,
  contentEditable,
}: {
  id: string;
  name: string;
  contentEditable?: boolean;
}) {
  return (
    <span
      data-slot="command"
      data-command-id={id}
      contentEditable={contentEditable}
      className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary"
    >
      {commandToken({ name, id })}
    </span>
  );
}

function CommandView({ attrs }: NodeViewProps<CommandAttrs>) {
  // Inline atom: no editable content slot, no engine — a static pill.
  return (
    <CommandPill id={attrs.id} name={attrs.name} contentEditable={false} />
  );
}

const commandCodec: NodeCodec<CommandAttrs> = {
  node: 'command',
  toMarkdown: (node) => commandToken(node.attrs ?? {}),
  toHTML: (node) => {
    const id = node.attrs?.id ?? '';
    const name = node.attrs?.name ?? '';
    const label = node.attrs?.label ?? '';
    return `<span data-command-id="${escapeHtml(id)}" data-command-name="${escapeHtml(name)}" data-command-label="${escapeHtml(label)}">${escapeHtml(commandToken({ name, id }))}</span>`;
  },
  toReact: (node) => {
    const attrs = node.attrs ?? { id: '', label: '', name: '' };
    return <CommandPill id={attrs.id} name={attrs.name} />;
  },
  fromHTML: (element) => {
    if (!element.getAttribute('data-command-id')) return null;
    return {
      type: 'command',
      attrs: {
        id: element.getAttribute('data-command-id') ?? '',
        label: element.getAttribute('data-command-label') ?? '',
        name:
          element.getAttribute('data-command-name') ??
          (element.textContent ?? '').replace(/^\//, ''),
      },
    };
  },
  // We deliberately don't reconstruct a command from prose Markdown.
  fromMarkdown: () => null,
};

/** The composer's `/command` inline-node feature — composed into `ChatInput`'s
 *  editor and `ChatMessageView`'s codec registry so one node serves both. */
export function slashCommand(): EditorFeature {
  return defineFeature({
    id: 'slash-command',
    nodes: [
      {
        name: 'command',
        group: 'inline',
        atom: true,
        selectable: true,
        attrs: commandAttrs,
        render: CommandView,
      },
    ],
    codecs: [commandCodec as NodeCodec],
    commands: {
      // `id`/`name` are required — a command token needs an identity and a slug
      // to display, so an insert without them is rejected before any mutation.
      insertCommand: {
        args: z.object({
          id: z.string(),
          label: z.string().default(''),
          name: z.string(),
        }),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'command',
              attrs: { id: args.id, label: args.label, name: args.name },
            },
          }),
      },
    },
  });
}
