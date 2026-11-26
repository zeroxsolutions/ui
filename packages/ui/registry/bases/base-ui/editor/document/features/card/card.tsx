import { useId, type ReactElement, type ReactNode } from 'react';
import { IdCardIcon } from '@/registry/bases/base-ui/icons/lucide/id-card-icon';
import { ImageIcon } from '@/registry/bases/base-ui/icons/lucide/image-icon';
import { LinkIcon } from '@/registry/bases/base-ui/icons/lucide/link-icon';
import { Button, buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { Block } from '@zeroxsolutions/editor-core/blocks/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewPropsOf } from '../../blocks/block-feature';
import { BlockAddressPopover } from '../../blocks/block-address-popover';
import { linkAddress, sourceAddress } from '../../blocks/block-address';
import {
  blockUploadRequest,
  uploadMessagesOf,
  uploadsExtension,
  UploadStatus,
  useBlockUpload,
  type BlockUploadControl,
  type BlockUploadOptions,
  type UploadRequest,
} from '../../uploads/index';

/** The fields a card's view reads, each `''` where the card leaves it out; its rich text is the body. */
export interface CardFields {
  readonly image: string;
  readonly alt: string;
  readonly heading: string;
  readonly buttonLabel: string;
  readonly buttonHref: string;
}

export interface CardOptions extends BlockUploadOptions {
  /** The host's words for what the editor shows on a card. */
  words?: Partial<CardWords>;
}

/** The words a card's view draws in the editor. */
export interface CardWords {
  /** The image's popover heading, and the name of the control that opens it. */
  readonly image: string;
  /** What an image-less card shows where its image goes. */
  readonly imagePlaceholder: string;
  readonly alt: string;
  readonly heading: string;
  /** The faint hint in a button with no label. */
  readonly buttonLabel: string;
  /** The button's link popover heading, and the name of the control that opens it. */
  readonly buttonHref: string;
  /** The popovers' button that sets the address. */
  readonly apply: string;
  /** What an address the card cannot open is told, in the button's and the image's popover. */
  readonly linkProblem: string;
  readonly imageProblem: string;
}

/** One line of text written in place on a card, drawn borderless in the card's own type. */
export interface CardTextProps {
  readonly label: string;
  readonly value: string;
  /** The faint hint while the line is empty. */
  readonly placeholder: string;
  readonly className?: string;
  onValueChange(value: string): void;
}

/** The popover that changes one address of a card, opened from `trigger`. */
export interface CardAddressProps {
  readonly kind: 'image' | 'link';
  readonly label: string;
  readonly value: string;
  readonly trigger: ReactElement;
  readonly tooltip?: string;
  onApply(address: string): void;
  /** The image's alt text, written in the image's popover. */
  readonly alt?: { readonly label: string; readonly value: string; onValueChange(value: string): void };
  /** Uploads a file into the address from an Upload tab; the address field alone when absent. */
  readonly upload?: BlockUploadControl | null;
}

/** The controls a card's view writes with; an editor of another profile hands in its own, as the email editor's. */
export interface CardParts {
  Text(props: CardTextProps): ReactNode;
  Address(props: CardAddressProps): ReactNode;
}

export interface CardViewProps {
  readonly fields: CardFields;
  /** The text: the editable inline content in the editor, its text in the Viewer; null for none. */
  readonly body: ReactNode;
  readonly editable: boolean;
  update(patch: Readonly<Record<string, unknown>>): void;
  readonly words: CardWords;
  /** The controls it writes with, built once per editor: `cardParts(words)` for the Document Editor's own. */
  readonly parts: CardParts;
  /** A card sits in a frame; a hero spans its column at a larger heading. Default card. */
  readonly variant?: 'card' | 'hero';
  readonly align?: 'left' | 'center';
  /** The button's look; outline as the Viewer draws it, default as an email draws it. */
  readonly buttonVariant?: 'outline' | 'default';
  /** The title's element outside the editor; h4 by default, the email's level where it draws one. */
  readonly headingAs?: 'h1' | 'h2' | 'h4';
  /**
   * What an image address that is not a web address draws in place of the image, such as the name of the
   * variable the email fills it from; nothing, so the card offers an image, when absent.
   */
  readonly imageStandIn?: (address: string) => ReactNode;
  /**
   * Whether a button with `address` is drawn, linked where the address is a web or mail one and plain otherwise;
   * a web or mail address alone when absent.
   */
  readonly drawsButton?: (address: string) => boolean;
  /** An upload into the image, drawn in its place while it runs or once it failed; none when absent. */
  readonly imageUpload?: BlockUploadControl | null;
}

export const DEFAULT_CARD_WORDS: CardWords = {
  image: 'Image',
  imagePlaceholder: 'Add an image',
  alt: 'Describe the image',
  heading: 'Title',
  buttonLabel: 'Add a button',
  buttonHref: 'Button link',
  apply: 'Apply',
  linkProblem: 'Use an address that starts with https://, http:// or mailto:',
  imageProblem: 'Use an image address that starts with https:// or http://',
};

function CardTextField({ label, value, placeholder, className, onValueChange }: CardTextProps): ReactNode {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        className={cn('placeholder:text-muted-foreground/60 w-full min-w-0 bg-transparent outline-none', className)}
      />
    </>
  );
}

/** The Document Editor's card controls: borderless inputs, and a popover with a plain address field. */
export function cardParts(words: CardWords): CardParts {
  return {
    Text: CardTextField,
    Address: function CardAddressPopover({
      kind,
      label,
      value,
      trigger,
      tooltip,
      onApply,
      alt,
      upload,
    }: CardAddressProps) {
      const altId = useId();
      return (
        <BlockAddressPopover
          label={label}
          value={value}
          placeholder="https://"
          trigger={trigger}
          tooltip={tooltip}
          applyLabel={words.apply}
          problems={(address) =>
            (kind === 'image' ? sourceAddress(address) : linkAddress(address)) === undefined
              ? [kind === 'image' ? words.imageProblem : words.linkProblem]
              : []
          }
          onApply={onApply}
          upload={upload}
        >
          {alt && (
            <Field>
              <FieldLabel htmlFor={altId}>{alt.label}</FieldLabel>
              <Input id={altId} value={alt.value} onChange={(event) => alt.onValueChange(event.currentTarget.value)} />
            </Field>
          )}
        </BlockAddressPopover>
      );
    },
  };
}

/**
 * A card: its image over its title, its text and a link button. In the editor each line is written in place, in
 * the type the Viewer draws it in, and the image and the button's link change in a popover opened from them, so
 * no address is ever drawn as text. The email editor draws its card and its hero with it, through its own parts.
 */
export function CardView({
  fields,
  body,
  editable,
  update,
  words,
  parts,
  variant = 'card',
  align = 'left',
  buttonVariant = 'outline',
  headingAs: Heading = 'h4',
  imageStandIn,
  drawsButton = (address) => linkAddress(address) !== undefined,
  imageUpload = null,
}: CardViewProps): ReactNode {
  const { Text, Address } = parts;
  const image = sourceAddress(fields.image);
  const href = linkAddress(fields.buttonHref);
  const unsent = fields.buttonLabel === '' || fields.buttonHref.trim() === '' || !drawsButton(fields.buttonHref);
  const hero = variant === 'hero';
  const standIn = image === undefined && fields.image.trim() !== '' ? imageStandIn?.(fields.image) : undefined;
  const uploading = imageUpload?.upload.entry ?? null;
  const shownImage = uploading?.preview ?? image;
  const imageElement = shownImage !== undefined && (
    <img
      data-slot="card-image"
      data-dimmed={uploading !== null || undefined}
      src={shownImage}
      alt={editable ? '' : fields.alt}
      contentEditable={false}
      // A hero's image is a block of its own; a card's sits flush in the card's top, which rounds it. Here and
      // below, each branch holding a slot is a `cn()` of its own, as `shadcn add` writes a style's classes for a
      // slot only into the first string of a `cn()`.
      className={
        hero
          ? cn('cn-editor-block w-full data-dimmed:opacity-50')
          : 'aspect-video w-full object-cover data-dimmed:opacity-50'
      }
    />
  );
  const status = uploading && imageUpload && (
    <UploadStatus
      entry={uploading}
      messages={imageUpload.messages}
      onCancel={imageUpload.upload.cancel}
      onRetry={imageUpload.upload.retry}
      readOnly={!editable}
      className={hero ? 'mt-2' : 'px-4 pt-2'}
    />
  );
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        'cn-editor-block not-prose my-4 flex flex-col overflow-hidden',
        !hero && 'border',
        align === 'center' && 'items-center text-center',
      )}
    >
      {editable ? (
        <div contentEditable={false} className="w-full">
          <Address
            kind="image"
            label={words.image}
            value={fields.image}
            tooltip={words.image}
            onApply={(address) => update({ image: address })}
            alt={{ label: words.alt, value: fields.alt, onValueChange: (alt) => update({ alt }) }}
            upload={imageUpload}
            trigger={
              imageElement ? (
                <button
                  type="button"
                  aria-label={words.image}
                  data-slot="card-image-trigger"
                  // An image that has not loaded still leaves a control to open its popover from.
                  className={
                    hero
                      ? cn(
                          'cn-editor-block cn-editor-control bg-muted/40 block min-h-12 w-full overflow-hidden outline-none',
                        )
                      : cn('cn-editor-control bg-muted/40 block min-h-12 w-full outline-none')
                  }
                >
                  {imageElement}
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={words.image}
                  data-slot="card-image-trigger"
                  className={
                    hero
                      ? cn(
                          'cn-editor-block cn-editor-control cn-field-description hover:bg-muted/50 flex aspect-[3/1] w-full items-center justify-center gap-2 border border-dashed outline-none',
                        )
                      : cn(
                          'cn-editor-control cn-field-description hover:bg-muted/50 flex aspect-[3/1] w-full items-center justify-center gap-2 border-b border-dashed outline-none',
                        )
                  }
                >
                  <ImageIcon size={16} aria-hidden />
                  {standIn ?? words.imagePlaceholder}
                </button>
              )
            }
          />
          {status}
        </div>
      ) : status ? (
        <div contentEditable={false} className="w-full">
          {imageElement}
          {status}
        </div>
      ) : (
        (imageElement || standIn) &&
        (imageElement || (
          <div
            className={
              hero
                ? cn(
                    'cn-editor-block cn-field-description flex aspect-[3/1] w-full items-center justify-center gap-2 border border-dashed',
                  )
                : cn(
                    'cn-field-description flex aspect-[3/1] w-full items-center justify-center gap-2 border-b border-dashed',
                  )
            }
          >
            <ImageIcon size={16} aria-hidden />
            {standIn}
          </div>
        ))
      )}
      <div className={cn('flex w-full flex-col gap-2', hero ? 'pt-4' : 'p-4', align === 'center' && 'items-center')}>
        {editable ? (
          <div contentEditable={false} className="w-full">
            <Text
              label={words.heading}
              placeholder={words.heading}
              value={fields.heading}
              className={cn(
                hero ? 'text-2xl font-bold' : 'text-base font-semibold',
                align === 'center' && 'text-center',
              )}
              onValueChange={(heading) => update({ heading })}
            />
          </div>
        ) : (
          fields.heading !== '' && (
            <Heading data-slot="card-title" className={hero ? 'text-2xl font-bold' : 'text-base font-semibold'}>
              {fields.heading}
            </Heading>
          )
        )}
        {body !== null && (
          <div data-slot="card-text" className={cn('text-muted-foreground min-h-5 text-sm', hero && 'w-full')}>
            {body}
          </div>
        )}
        {editable ? (
          <div contentEditable={false} data-slot="card-button" className="flex items-center gap-1">
            <span
              data-state={unsent ? 'empty' : 'set'}
              // A button with no label or no link is not drawn outside the editor; it is an outline to fill in.
              className={cn(
                buttonVariants({ variant: unsent ? 'outline' : buttonVariant, size: 'sm' }),
                unsent && 'text-muted-foreground border-dashed',
              )}
            >
              <Text
                label={words.buttonLabel}
                placeholder={words.buttonLabel}
                value={fields.buttonLabel}
                className="field-sizing-content min-w-16 text-center placeholder:text-current/60"
                onValueChange={(buttonLabel) => update({ buttonLabel })}
              />
            </span>
            <Address
              kind="link"
              label={words.buttonHref}
              value={fields.buttonHref}
              tooltip={words.buttonHref}
              onApply={(address) => update({ buttonHref: address })}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={words.buttonHref}
                  data-state={fields.buttonHref === '' ? 'empty' : 'set'}
                  className="data-[state=empty]:text-muted-foreground"
                >
                  <LinkIcon size={16} aria-hidden />
                </Button>
              }
            />
          </div>
        ) : (
          !unsent && (
            <a
              data-slot="card-button"
              href={href}
              className={cn(
                buttonVariants({ variant: buttonVariant, size: 'sm' }),
                'no-underline',
                align !== 'center' && 'self-start',
              )}
            >
              {fields.buttonLabel}
            </a>
          )
        )}
      </div>
    </div>
  );
}

/**
 * The card block of the Document Editor, from the card's shared definition, which the email editor's card
 * comes from too: an image, a title, a text and a link button.
 */
export function card(definition: Block, options: CardOptions = {}): EditorFeature {
  const words: CardWords = { ...DEFAULT_CARD_WORDS, ...options.words };
  const parts = cardParts(words);
  const requestOf = (): UploadRequest | null =>
    blockUploadRequest(options, { accept: 'image/*', preview: true, land: (_attrs, url) => ({ image: url }) });

  function CardFeatureView(props: BlockViewPropsOf<Block>): ReactNode {
    const upload = useBlockUpload(props.place, 'image', requestOf());
    return (
      <CardView
        {...props}
        fields={props.fields as unknown as CardFields}
        words={words}
        parts={parts}
        imageUpload={upload && { upload, messages: uploadMessagesOf(options.messages) }}
      />
    );
  }

  const feature = blockFeature(definition, { icon: IdCardIcon, view: CardFeatureView });
  return options.upload ? { ...feature, advanced: { engineExtensions: [uploadsExtension('card', null)] } } : feature;
}
