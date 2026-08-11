import type { ReactNode } from 'react';
import { FluentEmoji } from '@zeroxsolutions/fluent-emoji';
import { Info } from 'lucide-react';
import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
} from '@zeroxsolutions/editor-core/document/core/index';
import type {
  NodeJSON,
  NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import type { ReactNodeCodec } from '../../../react-types';

/**
 * A callout block — a custom node with a React node view (icon + colored palette
 * from the active theme) and a two-way Markdown codec using the **GitHub Alerts**
 * dialect (`> [!NOTE]`; design D4). Serves as the worked example for a custom
 * node-view feature: declarative `NodeSpec` + `render` + `NodeCodec` + slash,
 * all engine-free.
 */
const VARIANTS = ['note', 'info', 'success', 'warning', 'danger'] as const;
type Variant = (typeof VARIANTS)[number];

const calloutAttrs = z.object({
  variant: z.enum(VARIANTS).default('info'),
});
type CalloutAttrs = z.infer<typeof calloutAttrs>;

const ICON: Record<Variant, string> = {
  note: '📝',
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '⛔',
};

const VARIANT_TO_ALERT: Record<Variant, string> = {
  note: 'NOTE',
  info: 'IMPORTANT',
  success: 'TIP',
  warning: 'WARNING',
  danger: 'CAUTION',
};
const ALERT_TO_VARIANT: Record<string, Variant> = {
  NOTE: 'note',
  IMPORTANT: 'info',
  TIP: 'success',
  WARNING: 'warning',
  CAUTION: 'danger',
};

/**
 * Presentational shell shared by the editable node view and the static
 * `toReact` codec, so both surfaces render identically. Layout is Tailwind
 * utilities; the per-variant colors live in `styles.css` keyed on
 * `[data-callout]` (design-system `--info` / `--success` / … tokens that flip
 * with `.dark`), so a callout is themed even in the engine-free Viewer.
 */
function CalloutShell({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="callout"
      data-callout={variant}
      className="my-4 flex items-start gap-3 rounded-lg border p-4"
    >
      <FluentEmoji
        glyph={ICON[variant]}
        name={variant}
        variant="flat"
        aria-hidden
        className="mt-0.5 size-5 shrink-0 select-none"
      />
      <div className="min-w-0 flex-1 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

function CalloutView({ attrs, children }: NodeViewProps<CalloutAttrs>) {
  return (
    <CalloutShell variant={attrs.variant}>{children as ReactNode}</CalloutShell>
  );
}

const firstParagraphText = (token: {
  children?: Array<{ type: string; children?: Array<{ value?: unknown }> }>;
}): string => {
  const first = token.children?.[0];
  if (first?.type !== 'paragraph') return '';
  return String(first.children?.[0]?.value ?? '');
};

const calloutCodec: ReactNodeCodec<CalloutAttrs> = {
  node: 'callout',
  toMarkdown: (node, ctx) => {
    const variant = (node.attrs?.variant ?? 'info') as Variant;
    const body = ctx.serializeChildren(node as never);
    const quoted = body.split('\n').map((line) => (line ? `> ${line}` : '>'));
    return [`> [!${VARIANT_TO_ALERT[variant]}]`, ...quoted].join('\n');
  },
  toHTML: (node, ctx) =>
    `<div data-callout="${node.attrs?.variant ?? 'info'}">${ctx.serializeChildren(
      node as never,
    )}</div>`,
  toReact: (node, ctx) => {
    const v = (node.attrs?.variant ?? 'info') as Variant;
    return (
      <CalloutShell variant={v}>
        {ctx.renderChildren(node as never)}
      </CalloutShell>
    );
  },
  fromMarkdown: (token, ctx) => {
    if (token.type !== 'blockquote') return null;
    const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.exec(
      firstParagraphText(token as never).trim(),
    );
    if (!match) return null;
    const variant = ALERT_TO_VARIANT[match[1].toUpperCase()];
    const content = stripAlertMarker(ctx.fromMarkdownChildren(token));
    return { type: 'callout', attrs: { variant }, content };
  },
  fromHTML: (element, ctx) => {
    const variant = element.getAttribute('data-callout');
    if (!variant) return null;
    return {
      type: 'callout',
      attrs: { variant: (variant as Variant) ?? 'info' },
      content: ctx.fromHTMLChildren(element),
    };
  },
};

/** Drop the leading `[!NOTE]` marker text node from the reconstructed content. */
function stripAlertMarker(content: NodeJSON[]): NodeJSON[] {
  const first = content[0];
  const firstText = first?.content?.[0];
  if (
    first?.type !== 'paragraph' ||
    !firstText ||
    firstText.text === undefined
  ) {
    return content;
  }
  firstText.text = firstText.text.replace(/^\s*\[![A-Za-z]+\]\s*/, '');
  if (!firstText.text) first.content!.shift();
  return first.content && first.content.length === 0
    ? content.slice(1)
    : content;
}

export function callout(): EditorFeature {
  return defineFeature({
    id: 'callout',
    nodes: [
      {
        name: 'callout',
        group: 'block',
        content: 'block+',
        defining: true,
        attrs: calloutAttrs,
        render: CalloutView,
      },
    ],
    codecs: [calloutCodec as NodeCodec],
    commands: {
      insertCallout: {
        args: z
          .object({ variant: z.enum(VARIANTS).default('info') })
          .optional(),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'callout',
              attrs: { variant: args?.variant ?? 'info' },
              content: [{ type: 'paragraph' }],
            },
          }),
      },
    },
    slash: [
      {
        id: 'callout',
        icon: <Info className="size-4" />,
        title: 'Callout',
        description: 'Highlighted note block',
        group: 'Blocks',
        keywords: ['callout', 'note', 'admonition', 'alert'],
        command: 'insertCallout',
      },
    ],
  });
}
