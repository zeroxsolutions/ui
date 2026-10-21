import { Fragment, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
  type InputOTPLabelProps,
} from '../../ui/input-otp';

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
  ComponentProps<typeof InputOTP>,
  'maxLength' | 'pattern' | 'children' | 'containerClassName' | keyof InputOTPLabelProps
> &
  InputOTPLabelProps & {
    /** `6` (the default) draws one group of six slots; `3-3` two groups of three, for a code read off a message. */
    pattern?: CodeInputPattern;
    /**
     * What the whole code must match for a change to be taken, as the `pattern` of InputOTP, such as
     * `REGEXP_ONLY_DIGITS_AND_CHARS`; digits when omitted. A change that does not match is refused. Pass
     * `keyboardType` too when the code is not digits, since the field opens the number pad.
     */
    allowedCharacters?: string | RegExp;
  };

/**
 * A six-character one-time code over InputOTP, its slots filling the row's width. One text field sits
 * under the slots and takes every prop not named here: name it with `aria-label`, mark the code invalid
 * with `aria-invalid` (every slot draws destructive), and take the code with `value` and `onChange`:
 *
 *   <CodeInput aria-label="Verification code" pattern="3-3" value={code} onChange={setCode} />
 */
function CodeInput({ pattern = '6', allowedCharacters = REGEXP_ONLY_DIGITS, ...props }: CodeInputProps): ReactNode {
  const groups = CODE_INPUT_GROUPS[pattern];

  return (
    <InputOTP maxLength={CODE_INPUT_LENGTH} pattern={allowedCharacters} containerClassName="w-full gap-2" {...props}>
      {groups.map(([start, length], groupIndex) => (
        <Fragment key={start}>
          {groupIndex > 0 ? <InputOTPSeparator /> : null}
          <InputOTPGroup className="flex-1">
            {Array.from({ length }, (_, offset) => (
              <CodeInputSlot key={start + offset} index={start + offset} />
            ))}
          </InputOTPGroup>
        </Fragment>
      ))}
    </InputOTP>
  );
}

/**
 * One character of the code: an InputOTPSlot 48 high, its digit in large semibold text, that shares its
 * group's width with its siblings.
 * CodeInput renders these itself.
 */
function CodeInputSlot({ className, textClassName, ...props }: ComponentProps<typeof InputOTPSlot>): ReactNode {
  return (
    <InputOTPSlot
      className={cn('size-12 flex-1', className)}
      textClassName={cn('text-lg font-sans-semibold', textClassName)}
      {...props}
    />
  );
}

export { CodeInput, CodeInputSlot };
export type { CodeInputPattern, CodeInputProps };
