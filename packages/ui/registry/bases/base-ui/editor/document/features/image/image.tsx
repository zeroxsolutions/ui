import { useId, useState, type ReactNode } from 'react';
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
import {
  blockUploadRequest,
  uploadMessagesOf,
  uploadsExtension,
  UploadStatus,
  UploadTabs,
  useBlockUpload,
  type BlockUploadOptions,
  type UploadMessages,
  type UploadRequest,
  type UploadTaker,
} from '../../uploads/index';
import {
  layoutDataAttributes,
  layoutFromElement,
  type LayoutAttributes,
} from '@zeroxsolutions/editor-core/document/layout/index';
import {
  DOCUMENT_CONTENT_WIDTH,
  widthFromPixels,
  type LayoutWidth,
} from '@zeroxsolutions/editor-core/template/layout/index';
import { blockLayoutAttrs } from '../../blocks/block-layout-attrs';
import { BlockLayoutFrame, type BlockLayoutPlace } from '../../blocks/block-layout-frame';
import { layoutWordsOf, type LayoutWords } from '../../layout/layout-words';

/**
 * A block image — a pure custom node (no engine extension): declarative
 * `NodeSpec` + a React node view with an inline editing popover (source, alt
 * text, caption and link) and the block layout's toolbar and width handles + a
 * two-way `NodeCodec`. Markdown export is `![alt](src "title")`; HTML is the
 * unambiguous round-trip. Engine-free. Its `align` and `width` are the block
 * layout's.
 */
const imageAttrs = z.object({
  src: z.string().default(''),
  alt: z.string().default(''),
  title: z.string().default(''),
  caption: z.string().default(''),
  href: z.string().default(''),
  ...blockLayoutAttrs('image'),
});

/** An address a reader's browser opens as a page or a mail; any other, a script's included, links nowhere. */
const OPENED = /^(?:https?:|mailto:)/i;
const openedHref = (href: string | undefined): string | null =>
  href !== undefined && OPENED.test(href.trim()) ? href.trim() : null;
type ImageAttrs = z.infer<typeof imageAttrs>;

/**
 * The image's width as the layout reads it: a fraction or `full`, and a pixel width a document stored before the
 * layout read against the Document's content width, as the editor reads it on load.
 */
function imageWidthOf(width: unknown): LayoutWidth | null {
  if (width === 'full') return 'full';
  if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) return null;
  return width > 1 ? widthFromPixels(width, DOCUMENT_CONTENT_WIDTH) : width;
}

/** The words the image block draws: its popover's button and fields, and an image with no address. */
export interface ImageWords {
  readonly edit: string;
  readonly address: string;
  readonly alt: string;
  readonly altPlaceholder: string;
  readonly caption: string;
  readonly link: string;
  readonly empty: string;
}

export const DEFAULT_IMAGE_WORDS: ImageWords = {
  edit: 'Edit',
  address: 'Image address',
  alt: 'Alt text',
  altPlaceholder: 'Describe the image',
  caption: 'Caption',
  link: 'Link',
  empty: 'Empty image',
};

/** `words` over the English; a getter is read each time the block draws, so a host's language change shows. */
function imageWordsOf(words: Partial<ImageWords> | (() => ImageWords) | undefined): ImageWords {
  if (typeof words === 'function') return words();
  return words ? { ...DEFAULT_IMAGE_WORDS, ...words } : DEFAULT_IMAGE_WORDS;
}

/**
 * Presentational figure shared by the editable node view and the static
 * `toReact` codec, so both surfaces render the image identically, inside the
 * block layout's frame, which places it and sizes it. The editable chrome
 * (Edit button + popover) is passed as children by the node view.
 */
function ImageFigure({
  src,
  alt,
  title,
  width,
  caption,
  href,
  layout,
  selected,
  contentEditable,
  dimmed,
  status,
  empty,
  children,
}: {
  src: string;
  alt: string;
  title?: string;
  /** The layout's width; the image fills its frame at one, and is drawn at its own size at none. */
  width: LayoutWidth | null;
  caption?: string;
  /** Where the image links in the Viewer; the editor draws no link, so a click selects it. */
  href?: string | null;
  /** The frame's alignment, the editor the image is edited in (null in the Viewer) and the layout's words. */
  layout: {
    align: unknown;
    place: BlockLayoutPlace | null;
    words: LayoutWords;
  };
  selected?: boolean;
  contentEditable?: boolean;
  /** Drawn faint, as a file still uploading is. */
  dimmed?: boolean;
  /** How an upload into the image stands, under it. */
  status?: ReactNode;
  /** What an image with no address shows. */
  empty: string;
  children?: ReactNode;
}): ReactNode {
  const drawn = (
    <img
      src={src}
      alt={alt}
      title={title}
      data-dimmed={dimmed || undefined}
      className="cn-editor-block data-dimmed:bg-muted h-auto max-w-full border data-dimmed:min-h-24 data-dimmed:min-w-48 data-dimmed:opacity-50"
    />
  );
  return (
    <BlockLayoutFrame align={layout.align} width={width} resizable fit place={layout.place} words={layout.words}>
      <figure
        data-slot="image"
        data-selected={selected}
        data-empty={!src || undefined}
        contentEditable={contentEditable}
        // An image with no address takes the line, tall enough that its Edit button sits clear of what it shows.
        className="relative my-4 inline-block max-w-full data-empty:block"
      >
        {src ? (
          href ? (
            <a href={href}>{drawn}</a>
          ) : (
            drawn
          )
        ) : (
          <span
            data-slot="image-empty"
            className="cn-editor-block cn-field-description flex aspect-[3/1] min-h-28 w-full items-center justify-center gap-2 border border-dashed"
          >
            <ImageIcon size={16} aria-hidden />
            <span>{empty}</span>
          </span>
        )}
        {status}
        {caption || alt ? (
          <figcaption className="text-muted-foreground mt-1 text-sm">{caption || alt}</figcaption>
        ) : null}
        {children}
      </figure>
    </BlockLayoutFrame>
  );
}

/** What the image view uploads with: its request, null for an editor given no upload, and its words. */
interface ImageUploads {
  readonly request: UploadRequest | null;
  readonly messages: UploadMessages;
  readonly words: ImageWords;
  readonly layoutWords: LayoutWords;
}

const NO_UPLOADS: ImageUploads = {
  request: null,
  messages: uploadMessagesOf(undefined),
  words: DEFAULT_IMAGE_WORDS,
  layoutWords: layoutWordsOf(undefined),
};

function ImageEditView({
  attrs,
  updateAttrs,
  editable,
  selected,
  editor,
  getPos,
  uploads,
}: NodeViewProps<ImageAttrs> & { uploads: ImageUploads }): ReactNode {
  const srcId = useId();
  const altId = useId();
  const captionId = useId();
  const hrefId = useId();
  const [open, setOpen] = useState(false);
  const upload = useBlockUpload({ editor, getPos }, IMAGE_SLOT, uploads.request);
  const entry = upload?.entry ?? null;
  const { words } = uploads;
  return (
    <ImageFigure
      empty={words.empty}
      src={entry?.preview ?? attrs.src}
      alt={attrs.alt}
      title={attrs.title || undefined}
      width={imageWidthOf(attrs.width)}
      caption={attrs.caption}
      layout={{
        align: attrs.align,
        // A view drawn without its editor, as a spec draws one, has nothing to lay the image out in.
        place: editable && editor ? { editor, getPos } : null,
        words: uploads.layoutWords,
      }}
      selected={selected}
      contentEditable={false}
      dimmed={entry !== null}
      status={
        upload &&
        entry && (
          <UploadStatus
            entry={entry}
            messages={uploads.messages}
            onCancel={upload.cancel}
            onRetry={upload.retry}
            readOnly={!editable}
            className="mt-2"
          />
        )
      }
    >
      {editable && (
        // A design-system `Popover` for the alt and caption editor (DOM-anchored to the
        // image, unlike the caret-anchored chrome popovers). `contentEditable`
        // off + stopping pointer/mouse-down keeps opening it from moving the
        // ProseMirror selection or re-rendering this node view mid-edit.
        <span
          contentEditable={false}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          // Over the width handles, which reach into an image narrower than their reach.
          className="absolute top-2 right-2 z-20"
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <Button type="button" variant="outline" size="sm">
                  {words.edit}
                </Button>
              }
            />
            <PopoverContent align="end" className="w-72">
              <UploadTabs
                upload={upload}
                messages={uploads.messages}
                defaultTab={attrs.src === '' ? 'upload' : 'link'}
                onStart={() => setOpen(false)}
              >
                <Field>
                  <FieldLabel htmlFor={srcId}>{words.address}</FieldLabel>
                  <Input
                    id={srcId}
                    placeholder="https://"
                    defaultValue={attrs.src}
                    onBlur={(event) => {
                      const src = event.target.value.trim();
                      if (src === attrs.src) return;
                      // The author's address wins over a file still uploading into it.
                      upload?.cancel();
                      updateAttrs({ src });
                    }}
                  />
                </Field>
              </UploadTabs>
              <Field>
                <FieldLabel htmlFor={altId}>{words.alt}</FieldLabel>
                <Input
                  id={altId}
                  placeholder={words.altPlaceholder}
                  defaultValue={attrs.alt}
                  onBlur={(event) => updateAttrs({ alt: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={captionId}>{words.caption}</FieldLabel>
                <Input
                  id={captionId}
                  defaultValue={attrs.caption}
                  onBlur={(event) => updateAttrs({ caption: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={hrefId}>{words.link}</FieldLabel>
                <Input
                  id={hrefId}
                  placeholder="https://"
                  defaultValue={attrs.href}
                  onBlur={(event) => updateAttrs({ href: event.target.value.trim() })}
                />
              </Field>
            </PopoverContent>
          </Popover>
        </span>
      )}
    </ImageFigure>
  );
}

/** The image's node view in an editor whose images take an address only. */
export function ImageView(props: NodeViewProps<ImageAttrs>): ReactNode {
  return <ImageEditView {...props} uploads={NO_UPLOADS} />;
}

const attr = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const imageCodecOf = (wordsOf: () => ImageWords, layoutWords: () => LayoutWords): NodeCodec<ImageAttrs> => ({
  node: 'image',
  toMarkdown: (node) => {
    const { src = '', alt = '', title = '' } = node.attrs ?? {};
    return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
  },
  toHTML: (node) => {
    const { src = '', alt = '', title = '', align, width, caption = '', href = '' } = node.attrs ?? {};
    const layout = Object.entries(
      layoutDataAttributes({
        align,
        width: imageWidthOf(width) ?? undefined,
      } as LayoutAttributes),
    )
      .map(([name, value]) => ` ${name}="${attr(value)}"`)
      .join('');
    const t = title ? ` title="${attr(title)}"` : '';
    // Kept as data, so a link the document stores, a variable's included, reads back as written and never runs.
    const c = caption ? ` data-caption="${attr(caption)}"` : '';
    const h = href ? ` data-href="${attr(href)}"` : '';
    return `<img src="${attr(src)}" alt="${attr(alt)}"${t}${layout}${c}${h}>`;
  },
  toReact: (node) => {
    const { src = '', alt = '', title = '', align, width, caption = '', href } = node.attrs ?? {};
    return (
      <ImageFigure
        src={src}
        alt={alt}
        title={title || undefined}
        width={imageWidthOf(width)}
        layout={{ align, place: null, words: layoutWords() }}
        caption={caption}
        href={openedHref(href)}
        empty={wordsOf().empty}
      />
    );
  },
  fromHTML: (element) => {
    if (element.tagName !== 'IMG') return null;
    // An `<img width>` in pixels, as an older export wrote, reads as a share of the Document's content width.
    const { align, width } = layoutFromElement(element, DOCUMENT_CONTENT_WIDTH);
    return {
      type: 'image',
      attrs: {
        src: element.getAttribute('src') ?? '',
        alt: element.getAttribute('alt') ?? '',
        title: element.getAttribute('title') ?? '',
        caption: element.getAttribute('data-caption') ?? '',
        href: element.getAttribute('data-href') ?? '',
        ...(align === undefined ? {} : { align }),
        ...(width === undefined ? {} : { width }),
      },
    };
  },
  // Markdown import: standalone images arrive as inline tokens the walker drops
  // with a warning; HTML is image's two-way path in Phase 1.
});

/** The address of an image an upload fills. */
const IMAGE_SLOT = 'src';

export interface ImageOptions extends BlockUploadOptions {
  /**
   * What is wrong with an address an upload answered, each as a sentence, as a profile checks a typed one; the
   * upload fails with the first and the image keeps the address it had. Any web address is taken when absent.
   */
  problems?(url: string): readonly string[];
  /** The words the block draws, over the English; a getter is read each time it draws. */
  words?: Partial<ImageWords> | (() => ImageWords);
  /** The words of its layout toolbar and width handles, over the English; a getter is read each time it draws. */
  layoutWords?: Partial<LayoutWords> | (() => LayoutWords);
}

/**
 * The image block. Given `upload`, its popover uploads a file beside taking an address, and an image file pasted
 * or dropped into the editor becomes an image block that uploads it.
 */
export function image(options: ImageOptions = {}): EditorFeature {
  const requestOf = (): UploadRequest | null =>
    blockUploadRequest(options, {
      accept: 'image/*',
      preview: true,
      land: (_attrs, url) => ({ src: url }),
      problems: options.problems,
    });
  const taker: UploadTaker = {
    accept: 'image/*',
    slot: IMAGE_SLOT,
    node: (engine) => engine.schema.nodes.image?.create({ src: '' }) ?? null,
    request: () => requestOf() as UploadRequest,
  };
  const wordsOf = (): ImageWords => imageWordsOf(options.words);
  const layoutWords = (): LayoutWords => layoutWordsOf(options.layoutWords);
  const render = (props: NodeViewProps<ImageAttrs>) => (
    <ImageEditView
      {...props}
      uploads={{
        request: requestOf(),
        messages: uploadMessagesOf(options.messages),
        words: wordsOf(),
        layoutWords: layoutWords(),
      }}
    />
  );
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
        render,
      },
    ],
    codecs: [imageCodecOf(wordsOf, layoutWords) as NodeCodec],
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
    ...(options.upload ? { advanced: { engineExtensions: [uploadsExtension('image', taker)] } } : {}),
  });
}
