import { useState } from 'react';
import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeViewProps,
} from '../../core/index.js';

/**
 * A block image — a pure custom node (no engine extension): declarative
 * `NodeSpec` + a React node view with an inline editing popover (alt text +
 * width) + a two-way `NodeCodec`. Markdown export is `![alt](src "title")`;
 * HTML is the unambiguous round-trip. Engine-free.
 */
const imageAttrs = z.object({
  src: z.string().default(''),
  alt: z.string().default(''),
  title: z.string().default(''),
  width: z.number().nullable().default(null),
});
type ImageAttrs = z.infer<typeof imageAttrs>;

function ImageView({ attrs, updateAttrs, editable, selected }: NodeViewProps<ImageAttrs>) {
  const [editing, setEditing] = useState(false);
  const widthStyle = attrs.width ? `${attrs.width}px` : undefined;
  return (
    <div
      className="zerox-image"
      data-selected={selected}
      contentEditable={false}
      style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}
    >
      {attrs.src ? (
        <img
          src={attrs.src}
          alt={attrs.alt}
          title={attrs.title || undefined}
          style={{ width: widthStyle, maxWidth: '100%', height: 'auto', borderRadius: 4 }}
        />
      ) : (
        <span style={{ opacity: 0.6 }}>Empty image</span>
      )}
      {editable && (
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          style={{ position: 'absolute', top: 4, right: 4 }}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      )}
      {editable && editing && (
        <div
          className="zerox-image-popover"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: 8,
            zIndex: 10,
          }}
        >
          <input
            placeholder="Alt text"
            defaultValue={attrs.alt}
            onBlur={(e) => updateAttrs({ alt: e.target.value })}
          />
          <input
            placeholder="Width (px)"
            type="number"
            defaultValue={attrs.width ?? ''}
            onBlur={(e) =>
              updateAttrs({ width: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
      )}
    </div>
  );
}

const attr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const imageCodec: NodeCodec<ImageAttrs> = {
  node: 'image',
  toMarkdown: (node) => {
    const { src = '', alt = '', title = '' } = node.attrs ?? {};
    return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
  },
  toHTML: (node) => {
    const { src = '', alt = '', title = '', width } = node.attrs ?? {};
    const w = width ? ` width="${width}"` : '';
    const t = title ? ` title="${attr(title)}"` : '';
    return `<img src="${attr(src)}" alt="${attr(alt)}"${t}${w}>`;
  },
  toReact: (node) => {
    const { src = '', alt = '', title = '', width } = node.attrs ?? {};
    return (
      <img
        src={src}
        alt={alt}
        title={title || undefined}
        width={width ?? undefined}
      />
    );
  },
  fromHTML: (element) =>
    element.tagName === 'IMG'
      ? {
          type: 'image',
          attrs: {
            src: element.getAttribute('src') ?? '',
            alt: element.getAttribute('alt') ?? '',
            title: element.getAttribute('title') ?? '',
            width: element.getAttribute('width')
              ? Number(element.getAttribute('width'))
              : null,
          },
        }
      : null,
  // Markdown import: standalone images arrive as inline tokens the walker drops
  // with a warning; HTML is image's two-way path in Phase 1.
};

export function image(): EditorFeature {
  return defineFeature({
    id: 'image',
    nodes: [
      {
        name: 'image',
        group: 'block',
        atom: true,
        selectable: true,
        draggable: true,
        attrs: imageAttrs,
        render: ImageView,
      },
    ],
    codecs: [imageCodec as NodeCodec],
    commands: {
      insertImage: {
        args: z.object({
          src: z.string().min(1),
          alt: z.string().optional(),
          title: z.string().optional(),
        }),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: {
              type: 'image',
              attrs: { src: args.src, alt: args.alt ?? '', title: args.title ?? '' },
            },
          }),
      },
    },
    slash: [
      {
        id: 'image',
        title: 'Image',
        description: 'Embed an image by URL',
        group: 'Blocks',
        keywords: ['image', 'img', 'picture', 'photo'],
        command: 'insertImage',
      },
    ],
  });
}
