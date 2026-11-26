'use client';

import type { ReactNode } from 'react';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES } from '../messages';
import { VariableTextField } from '../variables/variable-text-field';
import { contextOf, selectBlockOf } from './kit-context';

export interface EmailInlineFieldProps {
  /** The editor the block is in; null where the block is drawn outside one, as the field's text alone. */
  editor: IEditor | null;
  /** The field's accessible name. */
  label: string;
  value: string;
  /** The faint hint while the field is empty. */
  placeholder: string;
  readOnly: boolean;
  onValueChange(value: string): void;
  className?: string;
}

/**
 * One line of a block written in place, in the type the email draws it in: no border and no caption, its hint
 * only while it is empty, and each `{{name}}` in it a variable chip. Taking the focus selects its block, so the
 * block menu's Mod-/ acts on it.
 */
export function EmailInlineField({
  editor,
  label,
  value,
  placeholder,
  readOnly,
  onValueChange,
  className,
}: EmailInlineFieldProps): ReactNode {
  if (!editor) {
    return value === '' ? null : (
      <span data-slot="email-inline-field" className={cn('block', className)}>
        {value}
      </span>
    );
  }
  const context = contextOf(editor)?.context;
  return (
    <span
      data-slot="email-inline-field"
      className="contents"
      onFocus={(event) => selectBlockOf(editor, event.currentTarget)}
    >
      <VariableTextField
        value={value}
        onValueChange={onValueChange}
        declarations={() => context?.declarations() ?? []}
        variables={context?.variables}
        label={label}
        placeholder={placeholder}
        readOnly={readOnly}
        messages={context?.messages() ?? DEFAULT_PROFILE_MESSAGES}
        // The text's own type, with a faint wash on hover and focus in place of an input's ring.
        className={cn('cn-editor-inline cn-editor-inline-field -mx-1 px-1', className)}
      />
    </span>
  );
}
