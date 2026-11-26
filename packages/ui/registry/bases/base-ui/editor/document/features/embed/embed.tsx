import type { ReactNode } from 'react';
import { FrameIcon } from '@/registry/bases/base-ui/icons/lucide/frame-icon';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { z } from 'zod';
import { defineFeature, type EditorFeature, type NodeCodec } from '@zeroxsolutions/editor-core/document/core/index';
import type { NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';
import {
  layoutDataAttributes,
  layoutFromElement,
  type LayoutAttributes,
} from '@zeroxsolutions/editor-core/document/layout/index';
import { blockLayoutAttrs } from '../../blocks/block-layout-attrs';
import { BlockLayoutFrame, type BlockLayoutPlace } from '../../blocks/block-layout-frame';
import { layoutWordsOf, type LayoutWords } from '../../layout/layout-words';

/**
 * An embed block — a block **atom** that renders an external URL as a responsive
 * `<iframe>`. Its React node view shows the iframe once a `url` is set, or a URL
 * input while the block is empty and editable. The two-way HTML codec round-trips
 * through `<div data-embed>` / `<iframe>`; Markdown has no embed primitive, so
 * Markdown export degrades to a plain link line and Markdown import declines.
 * Its `align` and `width` are the block layout's, drawn in its frame with the
 * layout toolbar and width handles in the editor, and carried as `data-*` in HTML.
 * Engine-free, mirroring the `callout`/`toggle` worked examples.
 *
 * Security: the embedded origin is untrusted — iframe `sandbox`/`allow` policy
 * and a host allowlist are a downstream (host-app) concern, not this leaf's.
 */
const embedAttrs = z.object({
  url: z.string().default(''),
  title: z.string().default(''),
  ...blockLayoutAttrs('embed'),
});
type EmbedAttrs = z.infer<typeof embedAttrs>;

/** Minimal HTML escape for the codec's string output (attribute + text). */
const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Responsive 16:9 iframe frame shared by the editable node view and the static
 * `toReact` codec, so both surfaces render identically. `data-embed` marks the
 * block (the codec reads it on import) and `contentEditable={false}` keeps the
 * frame out of the editable text flow.
 */
function EmbedFrame({ url, title }: { url: string; title: string }) {
  return (
    <div data-slot="embed" data-embed contentEditable={false} className="cn-editor-block my-4 overflow-hidden border">
      <iframe src={url} title={title} loading="lazy" className="aspect-video h-full w-full border-0" />
    </div>
  );
}

/** An embed's frame in its layout: placed and sized, with the editor's controls where `place` is given. */
function EmbedLayout({
  attrs,
  place,
  words,
}: {
  attrs: Partial<EmbedAttrs>;
  place: BlockLayoutPlace | null;
  words: LayoutWords;
}): ReactNode {
  return (
    <BlockLayoutFrame align={attrs.align} width={attrs.width} resizable fit={false} place={place} words={words}>
      <EmbedFrame url={attrs.url ?? ''} title={attrs.title ?? ''} />
    </BlockLayoutFrame>
  );
}

export function EmbedView({
  attrs,
  updateAttrs,
  editable,
  editor,
  getPos,
  words = layoutWordsOf(undefined),
}: NodeViewProps<EmbedAttrs> & { words?: LayoutWords }) {
  if (attrs.url) {
    // A view drawn without its editor, as a spec draws one, has nothing to lay the embed out in.
    return <EmbedLayout attrs={attrs} place={editable && editor ? { editor, getPos } : null} words={words} />;
  }
  if (!editable) {
    // Empty embed in the read-only Viewer: render nothing interactive.
    return <div contentEditable={false} />;
  }
  const commit = (value: string): void => {
    const url = value.trim();
    if (url) updateAttrs({ url });
  };
  return (
    <div className="my-4" contentEditable={false}>
      <Input
        type="url"
        placeholder="Paste a URL to embed…"
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
      />
    </div>
  );
}

const embedCodecOf = (words: () => LayoutWords): NodeCodec<EmbedAttrs> => ({
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
    const layout = Object.entries(
      layoutDataAttributes({ align: node.attrs?.align, width: node.attrs?.width } as LayoutAttributes),
    )
      .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
      .join('');
    return `<div data-embed data-url="${escapeHtml(url)}"${layout}><iframe src="${escapeHtml(
      url,
    )}" title="${escapeHtml(title)}"></iframe></div>`;
  },
  toReact: (node) => {
    // SSR-safe: a plain iframe, no engine and no browser-only APIs.
    return <EmbedLayout attrs={node.attrs ?? {}} place={null} words={words()} />;
  },
  fromHTML: (element) => {
    const isEmbed = element.hasAttribute('data-embed') || element.tagName === 'IFRAME';
    if (!isEmbed) return null;
    const { align, width } = layoutFromElement(element);
    return {
      type: 'embed',
      attrs: {
        ...(align === undefined ? {} : { align }),
        ...(width === undefined ? {} : { width }),
        url:
          element.getAttribute('data-url') ??
          element.querySelector('iframe')?.getAttribute('src') ??
          element.getAttribute('src') ??
          '',
        title: element.getAttribute('data-title') ?? element.querySelector('iframe')?.getAttribute('title') ?? '',
      },
    };
  },
  // We deliberately don't reconstruct an embed from a Markdown link.
  fromMarkdown: () => null,
});

export interface EmbedOptions {
  /** The words of its layout toolbar and width handles, over the English; a getter is read each time it draws. */
  layoutWords?: Partial<LayoutWords> | (() => LayoutWords);
}

export function embed(options: EmbedOptions = {}): EditorFeature {
  const words = (): LayoutWords => layoutWordsOf(options.layoutWords);
  const render = (props: NodeViewProps<EmbedAttrs>) => <EmbedView {...props} words={words()} />;
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
        render,
      },
    ],
    codecs: [embedCodecOf(words) as NodeCodec],
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
        icon: FrameIcon,
        title: 'Embed',
        description: 'Embed a URL',
        group: 'Blocks',
        keywords: ['embed', 'iframe', 'video', 'url'],
        command: 'insertEmbed',
      },
    ],
  });
}
