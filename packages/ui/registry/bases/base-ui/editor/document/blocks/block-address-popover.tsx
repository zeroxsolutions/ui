'use client';

import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldDescription, FieldError } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/bases/base-ui/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { TrashIcon } from '@/registry/bases/base-ui/icons/lucide/trash-icon';
import { DEFAULT_UPLOAD_MESSAGES } from '../uploads/upload';
import { UploadTabs } from '../uploads/upload-tabs';
import type { BlockUploadControl } from '../uploads/use-block-upload';

/** What a popover's address field is drawn from, when the host draws its own field in place of the input. */
export interface BlockAddressPopoverFieldProps {
  value: string;
  onValueChange(value: string): void;
  /** Enter: the address is done, as Apply. */
  onCommit(value: string): void;
  label: string;
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
}

export interface BlockAddressPopoverProps {
  /** The popover's heading and the field's accessible name. */
  label: string;
  /** The address the block holds, which the field starts from each time the popover opens. */
  value: string;
  /** The hint the field shows while it is empty. */
  placeholder: string;
  /** The control in the block that opens the popover: an image, a link icon or a button. */
  trigger: ReactElement;
  /** The tooltip over the trigger; none when absent. */
  tooltip?: string;
  /** What is wrong with an address, each as a sentence; Apply is refused while there is any. */
  problems?(address: string): readonly string[];
  /** Called with the trimmed address on Apply and on Enter, never with an empty one or one with problems. */
  onApply(address: string): void;
  applyLabel: string;
  /** Takes the address off the block; no remove control when absent. */
  onRemove?(): void;
  removeLabel?: string;
  /** Why the address cannot change, as in locked structure; the field is disabled while it is set. */
  disabledReason?: string | null;
  /** Draws the address field in place of the plain input, as a field that holds variables. */
  field?(props: BlockAddressPopoverFieldProps): ReactNode;
  /** Ready-made addresses under the field, each applied with `apply`. */
  choices?(apply: (address: string) => void): ReactNode;
  /** More fields under the address, such as an image's alt text. */
  children?: ReactNode;
  /** Where a press outside the popover keeps it open, as a menu the field opens in a layer of its own. */
  keepOpenWithin?: string;
  /** Uploads a file into the address, from an Upload tab beside the field's Link tab; the field alone when absent. */
  upload?: BlockUploadControl | null;
}

/**
 * The popover a block's image, link or button opens to change the address behind it, so the block draws what the
 * address leads to and never the address itself. The address field holds a draft; Apply or Enter writes it.
 */
export function BlockAddressPopover({
  label,
  value,
  placeholder,
  trigger,
  tooltip,
  problems = () => [],
  onApply,
  applyLabel,
  onRemove,
  removeLabel,
  disabledReason = null,
  field,
  choices,
  children,
  keepOpenWithin,
  upload = null,
}: BlockAddressPopoverProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const titleId = useId();
  const inputId = useId();
  const problemId = useId();
  const disabled = disabledReason !== null;
  const trimmed = draft.trim();
  const shown = trimmed === '' ? [] : problems(trimmed);

  const apply = (address: string): void => {
    const next = address.trim();
    if (next === '' || disabled || problems(next).length > 0) return;
    // The author's address wins over a file still uploading into it.
    upload?.upload.cancel();
    onApply(next);
    setOpen(false);
  };

  const opener = tooltip ? (
    <Tooltip>
      <TooltipTrigger render={<PopoverTrigger render={trigger} />} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    <PopoverTrigger render={trigger} />
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        const to = details.event instanceof FocusEvent ? details.event.relatedTarget : details.event?.target;
        if (!next && keepOpenWithin && to instanceof Element && to.closest(keepOpenWithin)) return;
        if (next) setDraft(value);
        setOpen(next);
      }}
    >
      {opener}
      <PopoverContent align="start" aria-labelledby={titleId} data-slot="block-address-popover" className="w-80">
        <PopoverHeader>
          <PopoverTitle id={titleId}>{label}</PopoverTitle>
        </PopoverHeader>
        <UploadTabs
          upload={disabled ? null : (upload?.upload ?? null)}
          messages={upload?.messages ?? DEFAULT_UPLOAD_MESSAGES}
          defaultTab={value === '' ? 'upload' : 'link'}
          onStart={() => setOpen(false)}
        >
          <Field data-invalid={shown.length > 0 || undefined} data-disabled={disabled || undefined}>
            {field ? (
              field({
                value: draft,
                onValueChange: setDraft,
                onCommit: apply,
                label,
                placeholder,
                disabled,
                invalid: shown.length > 0,
                describedBy: shown.length > 0 ? problemId : undefined,
              })
            ) : (
              <>
                <label htmlFor={inputId} className="sr-only">
                  {label}
                </label>
                <Input
                  id={inputId}
                  type="url"
                  value={draft}
                  placeholder={placeholder}
                  disabled={disabled}
                  aria-invalid={shown.length > 0 || undefined}
                  aria-describedby={shown.length > 0 ? problemId : undefined}
                  onChange={(event) => setDraft(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    apply(event.currentTarget.value);
                  }}
                />
              </>
            )}
            {disabled && <FieldDescription>{disabledReason}</FieldDescription>}
            {shown.length > 0 && <FieldError id={problemId} errors={shown.map((message) => ({ message }))} />}
          </Field>
          {!disabled && choices?.(apply)}
        </UploadTabs>
        {children}
        <div className="flex items-center justify-end gap-2">
          {onRemove && removeLabel && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={removeLabel}
                    disabled={disabled}
                    className="mr-auto"
                    onClick={() => {
                      upload?.upload.cancel();
                      onRemove();
                      setOpen(false);
                    }}
                  />
                }
              >
                <TrashIcon size={16} aria-hidden />
              </TooltipTrigger>
              <TooltipContent>{removeLabel}</TooltipContent>
            </Tooltip>
          )}
          <Button
            type="button"
            size="sm"
            disabled={trimmed === '' || disabled || shown.length > 0}
            onClick={() => apply(draft)}
          >
            {applyLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
