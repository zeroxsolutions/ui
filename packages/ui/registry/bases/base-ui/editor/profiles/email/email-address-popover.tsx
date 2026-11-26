'use client';

import { useId, type ReactElement, type ReactNode } from 'react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { hrefProblems, leadingToken, type VariableType } from '@zeroxsolutions/editor-core/template/index';
import { BUTTON_HREF_MAX_LENGTH } from '@zeroxsolutions/editor-core/template/email/index';
import { BlockAddressPopover } from '../../document/blocks/block-address-popover';
import type { BlockUploadControl } from '../../document/uploads/use-block-upload';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { variableIcon, variableLabel } from '../variables/variable';
import { VariableTextField } from '../variables/variable-text-field';
import { contextOf } from './kit-context';

/** An image a client loads: a literal web address, `https:` alone where the block loads only those. */
const IMAGE = /^https?:\/\//i;
const SECURE_IMAGE = /^https:\/\//i;

/**
 * What an author is told about `address`, a link's or an image's: each variable it names that is not declared,
 * then why it cannot open where it opens with neither a scheme the email sends nor a `url` variable.
 */
export function emailAddressProblems(
  address: string,
  kind: 'link' | 'image',
  secure: boolean,
  declarations: readonly VariableDeclaration[],
  messages: ProfileEditorMessages,
): string[] {
  const typeOf = (name: string): VariableType | undefined =>
    declarations.find((declaration) => declaration.name === name)?.type;
  const problems = hrefProblems(address, typeOf);
  const undeclared = [
    ...problems.flatMap((problem) =>
      problem.kind === 'variable-undeclared'
        ? [messages.problem({ kind: 'variable-undeclared', block: null, name: problem.name })]
        : [],
    ),
    // The write check refuses an address longer than a button's, which is every link's and image's bound.
    ...(address.length > BUTTON_HREF_MAX_LENGTH ? [messages.problem({ kind: 'text-too-long', block: null })] : []),
  ];
  if (kind === 'link') {
    return problems.some((problem) => problem.kind === 'href-invalid')
      ? [...undeclared, messages.problem({ kind: 'link-invalid', block: null })]
      : undeclared;
  }
  const token = leadingToken(address);
  const loads = token === undefined ? (secure ? SECURE_IMAGE : IMAGE).test(address.trim()) : typeOf(token) === 'url';
  return loads || (token !== undefined && typeOf(token) === undefined)
    ? undeclared
    : [...undeclared, messages.imageInvalid(secure)];
}

/**
 * The name of the variable an image address opens with, which the editor draws in place of an image it cannot
 * load before the email is sent; undefined for any other address.
 */
export function emailImageVariable(editor: IEditor | null, address: string): string | undefined {
  const name = leadingToken(address);
  if (name === undefined) return undefined;
  const declaration = (editor && contextOf(editor)?.context.declarations())?.find(
    (candidate) => candidate.name === name,
  );
  return declaration ? variableLabel(declaration) : name;
}

export interface EmailAddressPopoverProps {
  /** The email editor the block is in. */
  editor: IEditor;
  kind: 'link' | 'image';
  /** An image loads over `https:` only, as a library block's does. */
  secure?: boolean;
  /** The popover's heading and the field's name: the field's own label. */
  label: string;
  value: string;
  trigger: ReactElement;
  tooltip?: string;
  onApply(address: string): void;
  /** Takes the address off the block; none for a field the block requires. */
  onRemove?(): void;
  /** Why the address cannot change, or null. */
  disabledReason?: string | null;
  /** More fields under the address, such as an image's alt text. */
  children?: ReactNode;
  /** Uploads a file into the address from an Upload tab; the address field alone when absent. */
  upload?: BlockUploadControl | null;
}

/**
 * The email editor's address popover, as its link popover: one variable text field, so the address may be fixed,
 * hold variables or be a variable alone, and the declared `url` variables as one-click choices. Apply refuses an
 * address the email cannot send, so a block never holds one written here.
 */
export function EmailAddressPopover({
  editor,
  kind,
  secure = false,
  label,
  value,
  trigger,
  tooltip,
  onApply,
  onRemove,
  disabledReason = null,
  children,
  upload = null,
}: EmailAddressPopoverProps): ReactNode {
  const variablesId = useId();
  const context = contextOf(editor)?.context;
  const messages = context?.messages() ?? DEFAULT_PROFILE_MESSAGES;
  const declarations = () => context?.declarations() ?? [];
  const urls = declarations().filter((declaration) => declaration.type === 'url');
  return (
    <BlockAddressPopover
      label={label}
      value={value}
      placeholder={kind === 'link' ? messages.linkPlaceholder : messages.imageAddressPlaceholder}
      trigger={trigger}
      tooltip={tooltip}
      problems={(address) => emailAddressProblems(address, kind, secure, declarations(), messages)}
      onApply={onApply}
      applyLabel={messages.applyLink}
      onRemove={onRemove}
      removeLabel={messages.removeItem}
      disabledReason={disabledReason}
      // The toolbar's variable menu inserts into the field from a layer of its own; reaching it keeps the popover open.
      keepOpenWithin="[data-slot=variable-menu], [data-slot=combobox-content]"
      upload={upload}
      field={(field) => (
        <VariableTextField
          value={field.value}
          onValueChange={field.onValueChange}
          onCommit={field.onCommit}
          declarations={declarations}
          variables={context?.variables}
          label={field.label}
          placeholder={field.placeholder}
          disabled={field.disabled}
          invalid={field.invalid}
          describedBy={field.describedBy}
          autoFocus={!field.disabled}
          messages={messages}
          className="cn-input cn-editor-input h-auto min-h-8"
        />
      )}
      choices={(apply) =>
        urls.length > 0 && (
          <div role="group" aria-labelledby={variablesId} className="flex flex-col gap-1">
            <span id={variablesId} className="text-muted-foreground text-xs">
              {messages.linkVariables}
            </span>
            <div className="flex flex-wrap gap-1">
              {urls.map((declaration) => (
                <Button
                  key={declaration.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => apply(`{{${declaration.name}}}`)}
                >
                  {variableIcon(declaration.type)}
                  {variableLabel(declaration)}
                </Button>
              ))}
            </div>
          </div>
        )
      }
    >
      {children}
    </BlockAddressPopover>
  );
}
