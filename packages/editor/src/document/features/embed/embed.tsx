import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '../../core/index.js';
import type { NodeViewProps } from '../../core/index.js';

/**
 * An embed block — a block **atom** that renders an external URL as a responsive
 * `<iframe>`. Its React node view shows the iframe once a `url` is set, or a URL
 * input while the block is empty and editable. The two-way HTML codec round-trips
 * through `<div data-embed>` / `<iframe>`; Markdown has no embed primitive, so
 * Markdown export degrades to a plain link line and Markdown import declines.
 * Engine-free, mirroring the `callout`/`toggle` worked examples.
 *
 * Security: the embedded origin is untrusted — iframe `sandbox`/`allow` policy
 * and a host allowlist are a downstream (host-app) concern, not this leaf's.
 */
const embedAttrs = z.object({
  url: z.string().default(''),
  title: z.string().default(''),
});
type EmbedAttrs = z.infer<typeof embedAttrs>;

/** Minimal HTML escape for the codec's string output (attribute + text). */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Responsive 16:9 frame shared by the node view and the static React codec. */
const frameStyle = {
  width: '100%',
  aspectRatio: '16 / 9',
  border: 0,
} as const;

function EmbedView({ attrs, updateAttrs, editable }: NodeViewProps<EmbedAttrs>) {
  if (attrs.url) {
    return (
      <div className="zerox-embed" contentEditable={false} style={{ margin: '0.5rem 0' }}>
        <iframe src={attrs.url} title={attrs.title} loading="lazy" style={frameStyle} />
      </div>
    );
  }
  if (!editable) {
    // Empty embed in the read-only Viewer: render nothing interactive.
    return <div className="zerox-embed" contentEditable={false} />;
  }
  const commit = (value: string): void => {
    const url = value.trim();
    if (url) updateAttrs({ url });
  };
  return (
    <div className="zerox-embed" contentEditable={false} style={{ margin: '0.5rem 0' }}>
      <input
        type="url"
        placeholder="Paste a URL to embed…"
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid rgba(125, 125, 125, 0.4)',
          background: 'transparent',
          color: 'inherit',
        }}
      />
    </div>
  );
}

const embedCodec: NodeCodec<EmbedAttrs> = {
  node: 'embed',
  // Markdown has no embed primitive → degrade to a plain link line.
  toMarkdown: (node) => {
    const url = node.attrs?.url ?? '';
    const title = node.attrs?.title || url;
    return `[${title}](${url})`;
  },
  toHTML: (node) => {
    const url = node.attrs?.url ?? '';
    const title = node.attrs?.title ?? '';
    return `<div data-embed data-url="${escapeHtml(url)}"><iframe src="${escapeHtml(
      url,
    )}" title="${escapeHtml(title)}"></iframe></div>`;
  },
  toReact: (node) => {
    const attrs = node.attrs ?? { url: '', title: '' };
    // SSR-safe: a plain iframe, no engine and no browser-only APIs.
    return (
      <div className="zerox-embed" data-embed>
        <iframe src={attrs.url} title={attrs.title} loading="lazy" style={frameStyle} />
      </div>
    );
  },
  fromHTML: (element) => {
    const isEmbed = element.hasAttribute('data-embed') || element.tagName === 'IFRAME';
    if (!isEmbed) return null;
    return {
      type: 'embed',
      attrs: {
        url:
          element.getAttribute('data-url') ??
          element.querySelector('iframe')?.getAttribute('src') ??
          element.getAttribute('src') ??
          '',
        title: element.getAttribute('data-title') ?? '',
      },
    };
  },
  // We deliberately don't reconstruct an embed from a Markdown link.
  fromMarkdown: () => null,
};

export function embed(): EditorFeature {
  return defineFeature({
    id: 'embed',
    nodes: [
      {
        name: 'embed',
        group: 'block',
        atom: true,
        selectable: true,
        draggable: true,
        attrs: embedAttrs,
        render: EmbedView,
      },
    ],
    codecs: [embedCodec as NodeCodec],
    commands: {
      insertEmbed: {
        args: z.object({ url: z.string(), title: z.string().optional() }),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'embed',
              attrs: { url: args.url, title: args.title ?? '' },
            },
          }),
      },
    },
    slash: [
      {
        id: 'embed',
        title: 'Embed',
        description: 'Embed a URL',
        group: 'Blocks',
        keywords: ['embed', 'iframe', 'video', 'url'],
        command: 'insertEmbed',
      },
    ],
  });
}
