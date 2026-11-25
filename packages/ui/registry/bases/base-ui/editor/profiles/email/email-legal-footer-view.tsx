'use client';

import type { ReactNode } from 'react';
import { LinkIcon } from '@/registry/bases/base-ui/icons/lucide/link-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { UNSUBSCRIBE_LABEL } from '@zeroxsolutions/editor-core/template/email/index';
import { EmailAddressPopover } from './email-address-popover';
import { emailBlockText, type EmailBlockViewProps } from './email-block-feature';
import { EmailInlineField } from './email-inline-field';

/**
 * A legal footer in the email editor, as the email draws it: small muted lines on the left or centred, each written
 * in place, and the unsubscribe link drawn as a link with its label, whose address changes in the link popover.
 */
export function EmailLegalFooterView({
  block,
  values,
  body,
  editable,
  editor,
  words,
  update,
}: EmailBlockViewProps): ReactNode {
  const label = (name: string) => words.field(name, block.fields.find((field) => field.name === name)?.label ?? name);
  const line = (name: string) => (
    <EmailInlineField
      editor={editor}
      label={label(name)}
      placeholder={label(name)}
      value={emailBlockText(values, name)}
      readOnly={!editable}
      onValueChange={(value) => update({ [name]: value })}
    />
  );
  const unsubscribe = label('unsubscribe');
  const align = values.align === 'center' ? 'center' : 'left';
  return (
    <div
      data-slot="email-legal-footer"
      data-align={align}
      className="group/legal-footer text-muted-foreground flex flex-col gap-1 text-xs data-[align=center]:text-center"
    >
      <div data-slot="email-block-body" className="min-h-4">
        {body}
      </div>
      <div contentEditable={false} className="flex flex-col gap-1">
        {line('reason')}
        {line('address')}
        <div className="flex items-center gap-1 group-data-[align=center]/legal-footer:justify-center">
          <span className="underline underline-offset-2">
            <EmailInlineField
              editor={editor}
              label={label('unsubscribeLabel')}
              // The email words an unlabelled link with the block's default, which the hint shows.
              placeholder={UNSUBSCRIBE_LABEL}
              value={emailBlockText(values, 'unsubscribeLabel') || (editor ? '' : UNSUBSCRIBE_LABEL)}
              readOnly={!editable}
              onValueChange={(value) => update({ unsubscribeLabel: value })}
            />
          </span>
          {editor && editable && (
            <EmailAddressPopover
              editor={editor}
              kind="link"
              label={unsubscribe}
              value={emailBlockText(values, 'unsubscribe')}
              tooltip={unsubscribe}
              onApply={(address) => update({ unsubscribe: address })}
              trigger={
                <Button type="button" variant="ghost" size="icon-xs" aria-label={unsubscribe}>
                  <LinkIcon size={12} aria-hidden />
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
