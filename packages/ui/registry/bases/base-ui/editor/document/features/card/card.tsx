import { useId, type ReactNode } from 'react';
import { IdCardIcon } from '@/registry/bases/base-ui/icons/lucide/id-card-icon';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { Block } from '@zeroxsolutions/editor-core/blocks/index';
import type { EditorFeature } from '@zeroxsolutions/editor-core/document/core/index';
import { blockFeature, type BlockViewProps } from '../../blocks/block-feature';
import { BlockAddressField } from '../../blocks/block-address-field';
import { linkAddress, sourceAddress } from '../../blocks/block-address';

/** The fields a card's view reads, each `''` where the card leaves it out; its rich text is the body. */
interface CardFields {
  readonly image: string;
  readonly alt: string;
  readonly heading: string;
  readonly buttonLabel: string;
  readonly buttonHref: string;
}

export interface CardOptions {
  /** The host's words for the fields the editor shows on a card. */
  words?: {
    readonly image?: string;
    readonly imagePlaceholder?: string;
    readonly alt?: string;
    readonly heading?: string;
    readonly buttonLabel?: string;
    readonly buttonHref?: string;
  };
}

type CardWords = Required<NonNullable<CardOptions['words']>>;

/** One line of a card the author writes in the editor, drawn borderless in the card's own type. */
function CardTextField({
  label,
  value,
  className,
  onValueChange,
}: {
  label: string;
  value: string;
  className?: string;
  onValueChange(value: string): void;
}): ReactNode {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={label}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        className={cn('placeholder:text-muted-foreground/60 w-full min-w-0 bg-transparent outline-none', className)}
      />
    </>
  );
}

/**
 * A card: its image over its title, its text and a link button. The editor draws the title and the button as
 * fields the author writes in, in the type the Viewer draws them in.
 */
function CardView({
  fields,
  body,
  editable,
  update,
  words,
}: Pick<BlockViewProps<never, never>, 'body' | 'editable' | 'update'> & {
  fields: CardFields;
  words: CardWords;
}): ReactNode {
  const image = sourceAddress(fields.image);
  const href = linkAddress(fields.buttonHref);
  return (
    <div data-slot="card" className="cn-editor-block not-prose my-4 flex flex-col overflow-hidden border">
      {image !== undefined ? (
        <img
          data-slot="card-image"
          src={image}
          alt={fields.alt}
          contentEditable={false}
          className="aspect-video w-full object-cover"
        />
      ) : (
        editable && (
          <BlockAddressField
            label={words.image}
            placeholder={words.imagePlaceholder}
            className="mx-4 mt-4 mb-0"
            onCommit={(address) => update({ image: address })}
          />
        )
      )}
      <div className="flex flex-col gap-2 p-4">
        {editable ? (
          <div contentEditable={false} className="flex flex-col gap-1">
            {image !== undefined && (
              <CardTextField
                label={words.alt}
                value={fields.alt}
                className="text-muted-foreground text-xs"
                onValueChange={(alt) => update({ alt })}
              />
            )}
            <CardTextField
              label={words.heading}
              value={fields.heading}
              className="text-base font-semibold"
              onValueChange={(heading) => update({ heading })}
            />
          </div>
        ) : (
          fields.heading !== '' && (
            <h4 data-slot="card-title" className="text-base font-semibold">
              {fields.heading}
            </h4>
          )
        )}
        {body !== null && (
          <div data-slot="card-text" className="text-muted-foreground min-h-5 text-sm">
            {body}
          </div>
        )}
        {editable ? (
          <div contentEditable={false} className="flex gap-2 border-t pt-2 text-sm">
            <CardTextField
              label={words.buttonLabel}
              value={fields.buttonLabel}
              className="font-medium"
              onValueChange={(buttonLabel) => update({ buttonLabel })}
            />
            <CardTextField
              label={words.buttonHref}
              value={fields.buttonHref}
              className="text-muted-foreground font-mono text-xs"
              onValueChange={(buttonHref) => update({ buttonHref })}
            />
          </div>
        ) : (
          fields.buttonLabel !== '' &&
          href !== undefined && (
            <a
              data-slot="card-button"
              href={href}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start no-underline')}
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
  const words: CardWords = {
    image: options.words?.image ?? 'Image link',
    imagePlaceholder: options.words?.imagePlaceholder ?? 'Paste an image link',
    alt: options.words?.alt ?? 'Describe the image',
    heading: options.words?.heading ?? 'Title',
    buttonLabel: options.words?.buttonLabel ?? 'Button label',
    buttonHref: options.words?.buttonHref ?? 'Button link',
  };
  return blockFeature(definition, {
    icon: IdCardIcon,
    view: (props) => <CardView {...props} fields={props.fields as unknown as CardFields} words={words} />,
  });
}
