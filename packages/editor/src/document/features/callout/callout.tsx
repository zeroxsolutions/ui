import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '../../core/index.js';
import type { NodeJSON, NodeViewProps } from '../../core/index.js';
import { useEditorTheme } from '../../../shared/theme/editor-theme-context.js';

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

function CalloutView({ attrs, children }: NodeViewProps<CalloutAttrs>) {
  // CSS-variable-based palette → flips with the design system's `.dark` even
  // inside the engine's separate node-view root, so no React context is needed
  // for dark mode here.
  const { variant } = useEditorTheme();
  const palette = variant.callouts[attrs.variant] ?? variant.callouts.info;
  return (
    <div
      className="zerox-callout"
      data-callout={attrs.variant}
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        border: `1px solid ${palette.border}`,
        background: palette.background,
        color: palette.foreground,
      }}
    >
      <span aria-hidden style={{ color: palette.icon }}>
        {ICON[attrs.variant]}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const firstParagraphText = (token: {
  children?: Array<{ type: string; children?: Array<{ value?: unknown }> }>;
}): string => {
  const first = token.children?.[0];
  if (first?.type !== 'paragraph') return '';
  return String(first.children?.[0]?.value ?? '');
};

const calloutCodec: NodeCodec<CalloutAttrs> = {
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
      <div className="zerox-callout" data-callout={v}>
        <span aria-hidden>{ICON[v]}</span>
        <div>{ctx.renderChildren(node as never)}</div>
      </div>
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
  if (first?.type !== 'paragraph' || !firstText || firstText.text === undefined) {
    return content;
  }
  firstText.text = firstText.text.replace(/^\s*\[![A-Za-z]+\]\s*/, '');
  if (!firstText.text) first.content!.shift();
  return first.content && first.content.length === 0 ? content.slice(1) : content;
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
        args: z.object({ variant: z.enum(VARIANTS).default('info') }).optional(),
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
        title: 'Callout',
        description: 'Highlighted note block',
        group: 'Blocks',
        keywords: ['callout', 'note', 'admonition', 'alert'],
        command: 'insertCallout',
      },
    ],
  });
}
