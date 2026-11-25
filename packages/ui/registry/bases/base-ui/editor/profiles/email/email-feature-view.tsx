'use client';

import { useId, useMemo, type ReactNode } from 'react';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  CardView,
  DEFAULT_CARD_WORDS,
  type CardAddressProps,
  type CardFields,
  type CardParts,
  type CardTextProps,
} from '../../document/features/card/card';
import { DEFAULT_PROFILE_MESSAGES } from '../messages';
import { VariableTextField } from '../variables/variable-text-field';
import { EmailAddressPopover, emailImageVariable } from './email-address-popover';
import { emailBlockText, type EmailBlockViewProps } from './email-block-feature';
import { EmailInlineField } from './email-inline-field';
import { contextOf } from './kit-context';

/** The card's controls in an email editor: fields that hold variables, and the email's address popover. */
function emailCardParts(editor: IEditor | null, readOnly: boolean): CardParts {
  return {
    Text: function EmailCardText({ label, value, placeholder, className, onValueChange }: CardTextProps) {
      return (
        <EmailInlineField
          editor={editor}
          label={label}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onValueChange={onValueChange}
          className={className}
        />
      );
    },
    Address: function EmailCardAddress({ kind, label, value, trigger, tooltip, onApply, alt }: CardAddressProps) {
      const altId = useId();
      if (!editor) return null;
      const context = contextOf(editor)?.context;
      return (
        <EmailAddressPopover
          editor={editor}
          kind={kind}
          secure
          label={label}
          value={value}
          trigger={trigger}
          tooltip={tooltip}
          onApply={onApply}
          onRemove={kind === 'link' && value !== '' ? () => onApply('') : undefined}
        >
          {alt && (
            <Field>
              <FieldLabel id={altId}>{alt.label}</FieldLabel>
              <VariableTextField
                value={alt.value}
                onValueChange={alt.onValueChange}
                declarations={() => context?.declarations() ?? []}
                variables={context?.variables}
                label={alt.label}
                readOnly={readOnly}
                messages={context?.messages() ?? DEFAULT_PROFILE_MESSAGES}
                className="cn-input h-auto min-h-8"
              />
            </Field>
          )}
        </EmailAddressPopover>
      );
    },
  };
}

/**
 * A hero or a card in the email editor, drawn by the Document Editor's card view as the email draws it: the image,
 * the heading, the text and the button written in place, the image and the button's link in a popover.
 */
export function EmailFeatureView({
  variant,
  block,
  values,
  body,
  editable,
  editor,
  words,
  messages,
  update,
}: EmailBlockViewProps & { variant: 'hero' | 'card' }): ReactNode {
  const label = (name: string) => words.field(name, block.fields.find((field) => field.name === name)?.label ?? name);
  const parts = useMemo(() => emailCardParts(editor, !editable), [editor, editable]);
  const fields: CardFields = {
    image: emailBlockText(values, 'image'),
    alt: emailBlockText(values, 'alt'),
    heading: emailBlockText(values, 'heading'),
    buttonLabel: emailBlockText(values, 'buttonLabel'),
    buttonHref: emailBlockText(values, 'buttonHref'),
  };
  return (
    <CardView
      fields={fields}
      body={body}
      editable={editor !== null && editable}
      update={update}
      parts={parts}
      variant={variant}
      align={values.align === 'center' ? 'center' : 'left'}
      buttonVariant="default"
      headingAs={variant === 'hero' ? 'h1' : 'h2'}
      imageStandIn={(address) => emailImageVariable(editor, address)}
      // The popover writes only an address the email can send, and the email draws the button whenever both are set.
      drawsButton={() => true}
      words={{
        ...DEFAULT_CARD_WORDS,
        image: label('image'),
        imagePlaceholder: messages.imagePlaceholder,
        alt: label('alt'),
        heading: label('heading'),
        buttonLabel: messages.buttonPlaceholder,
        buttonHref: label('buttonHref'),
      }}
    />
  );
}
