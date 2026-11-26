'use client';

import type { ReactNode } from 'react';
import { SOCIAL_ICON_SIZES } from '@zeroxsolutions/editor-core/template/email/index';
import type { EmailBlockViewProps } from './email-block-feature';
import { EmailBlockItems, emailBlockItemsOf } from './email-block-items';

/**
 * Social links in the email editor, as the email draws them: a row of the icons at their size and alignment. An
 * icon opens a popover of its label, its icon and its link; the plus at the row's end adds one.
 */
export function EmailSocialLinksView({
  block,
  values,
  editable,
  restructure,
  editor,
  place,
  words,
  update,
}: EmailBlockViewProps): ReactNode {
  const [items] = block.items;
  if (!items) return null;
  const align = values.align === 'center' || values.align === 'right' ? values.align : 'left';
  return (
    <div contentEditable={false}>
      <EmailBlockItems
        editor={editor}
        place={place}
        items={items}
        entries={emailBlockItemsOf(items, values[items.name])}
        label={words.field(items.name, items.label)}
        fieldLabel={(field, fallback) => words.field(`${items.name}.${field}`, fallback)}
        readOnly={!editable}
        restructure={restructure}
        secure
        size={values.size === 'small' ? SOCIAL_ICON_SIZES.small : SOCIAL_ICON_SIZES.medium}
        align={align}
        onValueChange={(entries) => update({ [items.name]: entries })}
      />
    </div>
  );
}
