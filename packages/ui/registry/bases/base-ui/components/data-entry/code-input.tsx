'use client';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/registry/bases/base-ui/ui/input-otp';

/** How the six characters are grouped: one group of six, or two groups of three. */
type CodeInputPattern = '6' | '3-3';

/** The first slot index of each group, and how many slots it holds, for each pattern. */
const CODE_INPUT_GROUPS: Record<CodeInputPattern, readonly (readonly [start: number, length: number])[]> = {
  '6': [[0, 6]],
  '3-3': [
    [0, 3],
    [3, 3],
  ],
};
const CODE_INPUT_LENGTH = 6;

type CodeInputProps = Omit<
  React.ComponentProps<typeof InputOTP>,
  'maxLength' | 'pattern' | 'render' | 'children' | 'containerClassName'
> & {
  /** `6` (the default) draws one group of six slots; `3-3` two groups of three, for a code read off a message. */
  pattern?: CodeInputPattern;
  /**
   * The characters the code may hold, as a regular expression's source that each character is tested
   * against; digits when omitted. A character outside it is refused as it is typed or pasted.
   */
  allowedCharacters?: string;
};

/**
 * A six-character one-time code over upstream's `InputOTP`, its slots filling the container's width.
 * One real input sits under the slots and carries every prop not named here: `aria-invalid` marks the
 * code invalid (and draws each slot in the destructive tone), `value` and `onChange` take the code as
 * a string, and `autoComplete` stays `one-time-code` unless the caller says otherwise:
 *
 *   <CodeInput id="code" pattern="3-3" value={code} onChange={setCode} />
 *
 * `className` and the root's `data-slot="code-input"` and `data-pattern` land on that input, since
 * upstream's container takes only `containerClassName`, which this component sets.
 */
function CodeInput({
  pattern = '6',
  allowedCharacters = REGEXP_ONLY_DIGITS,
  autoComplete = 'one-time-code',
  'aria-invalid': ariaInvalid,
  ...props
}: CodeInputProps): React.ReactNode {
  const groups = CODE_INPUT_GROUPS[pattern];
  return (
    <InputOTP
      data-slot="code-input"
      data-pattern={pattern}
      maxLength={CODE_INPUT_LENGTH}
      pattern={allowedCharacters}
      autoComplete={autoComplete}
      aria-invalid={ariaInvalid}
      containerClassName="w-full gap-2"
      {...props}
    >
      {groups.map(([start, length], groupIndex) => (
        <React.Fragment key={start}>
          {groupIndex > 0 && <InputOTPSeparator role="presentation" aria-hidden />}
          <InputOTPGroup className={cn('w-full', groups.length > 1 && 'flex-1')}>
            {Array.from({ length }, (_, offset) => (
              <CodeInputSlot key={start + offset} index={start + offset} aria-invalid={ariaInvalid} />
            ))}
          </InputOTPGroup>
        </React.Fragment>
      ))}
    </InputOTP>
  );
}

/**
 * One character of the code: upstream's `InputOTPSlot`, 48px tall and sharing its group's width with
 * its siblings. The active slot draws all four of its borders, where upstream leaves its left edge to
 * the slot before it. `CodeInput` renders these itself; compose them inside upstream's `InputOTP` and
 * `InputOTPGroup` only for a grouping neither pattern draws.
 */
function CodeInputSlot({ className, ...props }: React.ComponentProps<typeof InputOTPSlot>): React.ReactNode {
  return (
    <InputOTPSlot
      data-slot="code-input-slot"
      className={cn(
        'h-12 flex-1 text-lg font-semibold data-[active=true]:border-l [&:has(+[data-active=true])]:border-r-0',
        className,
      )}
      {...props}
    />
  );
}

export { CodeInput, CodeInputSlot };
export type { CodeInputPattern };
