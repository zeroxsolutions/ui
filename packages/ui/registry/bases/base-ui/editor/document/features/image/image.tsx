import { useId, type ReactNode } from 'react';
import { ImageIcon } from '@/registry/bases/base-ui/icons/lucide/image-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { z } from 'zod';
import {
  defineFeature,
  type EditorFeature,
  type NodeCodec,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';

/**
 * A block image — a pure custom node (no engine extension): declarative
 * `NodeSpec` + a React node view with an inline editing popover (source, alt
 * text, caption, link and width) + a two-way `NodeCodec`. Markdown export is
 * `![alt](src "title")`; HTML is the unambiguous round-trip. Engine-free.
 */
const imageAttrs = z.object({
  src: z.string().default(''),
  alt: z.string().default(''),
  title: z.string().default(''),
  width: z.number().nullable().default(null),
  caption: z.string().default(''),
  href: z.string().default(''),
});

/** An address a reader's browser opens as a page or a mail; any other, a script's included, links nowhere. */
const OPENED = /^(?:https?:|mailto:)/i;
const openedHref = (href: string | undefined): string | null =>
  href !== undefined && OPENED.test(href.trim()) ? href.trim() : null;
type ImageAttrs = z.infer<typeof imageAttrs>;

/**
 * Presentational figure shared by the editable node view and the static
 * `toReact` codec, so both surfaces render the image identically. Layout and
 * colors are design-system token utilities; the computed pixel width stays an
 * inline style. The editable chrome (Edit button + popover) is passed as
 * children by the node view.
 */
function ImageFigure({
  src,
  alt,
  title,
  width,
  caption,
  href,
  selected,
  contentEditable,
  children,
}: {
  src: string;
  alt: string;
  title?: string;
  width: number | null;
  caption?: string;
  /** Where the image links in the Viewer; the editor draws no link, so a click selects it. */
  href?: string | null;
  selected?: boolean;
  contentEditable?: boolean;
  children?: ReactNode;
}) {
  const drawn = (
    <img
      src={src}
      alt={alt}
      title={title}
      className="cn-editor-block h-auto max-w-full border"
      style={{ width: width ? `${width}px` : undefined }}
    />
  );
  return (
    <figure
      data-slot="image"
      data-selected={selected}
      contentEditable={contentEditable}
      className="relative my-4 inline-block max-w-full"
    >
      {src ? (
        href ? (
          <a href={href}>{drawn}</a>
        ) : (
          drawn
        )
      ) : (
        <span className="text-muted-foreground text-sm">Empty image</span>
      )}
      {caption || alt ? <figcaption className="text-muted-foreground mt-1 text-sm">{caption || alt}</figcaption> : null}
      {children}
    </figure>
  );
}

export function ImageView({ attrs, updateAttrs, editable, selected }: NodeViewProps<ImageAttrs>) {
  const srcId = useId();
  const altId = useId();
  const captionId = useId();
  const hrefId = useId();
  const widthId = useId();
  return (
    <ImageFigure
      src={attrs.src}
      alt={attrs.alt}
      title={attrs.title || undefined}
      width={attrs.width}
      caption={attrs.caption}
      selected={selected}
      contentEditable={false}
    >
      {editable && (
        // A design-system `Popover` for the alt/width editor (DOM-anchored to the
        // image, unlike the caret-anchored chrome popovers). `contentEditable`
        // off + stopping pointer/mouse-down keeps opening it from moving the
        // ProseMirror selection or re-rendering this node view mid-edit.
        <span
          contentEditable={false}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute top-2 right-2"
        >
          <Popover>
            <PopoverTrigger
              render={
                <Button type="button" variant="outline" size="sm">
                  Edit
                </Button>
              }
            />
            <PopoverContent align="end" className="w-72 gap-3">
              <Field>
                <FieldLabel htmlFor={srcId}>Image address</FieldLabel>
                <Input
                  id={srcId}
                  placeholder="https://"
                  defaultValue={attrs.src}
                  onBlur={(event) => updateAttrs({ src: event.target.value.trim() })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={altId}>Alt text</FieldLabel>
                <Input
                  id={altId}
                  placeholder="Describe the image"
                  defaultValue={attrs.alt}
                  onBlur={(event) => updateAttrs({ alt: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={captionId}>Caption</FieldLabel>
                <Input
                  id={captionId}
                  defaultValue={attrs.caption}
                  onBlur={(event) => updateAttrs({ caption: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={hrefId}>Link</FieldLabel>
                <Input
                  id={hrefId}
                  placeholder="https://"
                  defaultValue={attrs.href}
                  onBlur={(event) => updateAttrs({ href: event.target.value.trim() })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={widthId}>Width (px)</FieldLabel>
                <Input
                  id={widthId}
                  type="number"
                  placeholder="Auto"
                  defaultValue={attrs.width ?? ''}
                  onBlur={(event) =>
                    updateAttrs({
                      width: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                />
              </Field>
            </PopoverContent>
          </Popover>
        </span>
      )}
    </ImageFigure>
  );
}

const attr = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const imageCodec: NodeCodec<ImageAttrs> = {
  node: 'image',
  toMarkdown: (node) => {
    const { src = '', alt = '', title = '' } = node.attrs ?? {};
    return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
  },
  toHTML: (node) => {
    const { src = '', alt = '', title = '', width, caption = '', href = '' } = node.attrs ?? {};
    const w = typeof width === 'number' && width > 0 ? ` width="${Math.round(width)}"` : '';
    const t = title ? ` title="${attr(title)}"` : '';
    // Kept as data, so a link the document stores, a variable's included, reads back as written and never runs.
    const c = caption ? ` data-caption="${attr(caption)}"` : '';
    const h = href ? ` data-href="${attr(href)}"` : '';
    return `<img src="${attr(src)}" alt="${attr(alt)}"${t}${w}${c}${h}>`;
  },
  toReact: (node) => {
    const { src = '', alt = '', title = '', width, caption = '', href } = node.attrs ?? {};
    return (
      <ImageFigure
        src={src}
        alt={alt}
        title={title || undefined}
        width={width ?? null}
        caption={caption}
        href={openedHref(href)}
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
            width: element.getAttribute('width') ? Number(element.getAttribute('width')) : null,
            caption: element.getAttribute('data-caption') ?? '',
            href: element.getAttribute('data-href') ?? '',
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
              attrs: {
                src: args.src,
                alt: args.alt ?? '',
                title: args.title ?? '',
              },
            },
          }),
      },
    },
    slash: [
      {
        id: 'image',
        icon: ImageIcon,
        title: 'Image',
        description: 'Embed an image by URL',
        group: 'Blocks',
        keywords: ['image', 'img', 'picture', 'photo'],
        command: 'insertImage',
      },
    ],
  });
}
