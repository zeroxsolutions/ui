'use client';

import * as React from 'react';

import { CircleCheckIcon } from '@/registry/bases/base-ui/icons/circle-check-icon';
import { CircleIcon } from '@/registry/bases/base-ui/icons/circle-icon';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Card } from '@/registry/bases/base-ui/ui/card';
import { Progress, ProgressLabel, ProgressValue } from '@/registry/bases/base-ui/ui/progress';

/** How strong the password is, from the caller's own check. */
type PasswordStrengthValue = 'weak' | 'fair' | 'strong';

/** The meter's step for each strength, out of `PASSWORD_STRENGTH_STEPS`. */
const PASSWORD_STRENGTH_STEP: Record<PasswordStrengthValue, number> = { weak: 1, fair: 2, strong: 3 };
const PASSWORD_STRENGTH_STEPS = 3;

const PasswordStrengthContext = React.createContext<PasswordStrengthValue | null>(null);

function usePasswordStrength(): PasswordStrengthValue {
  const strength = React.useContext(PasswordStrengthContext);
  if (strength === null) throw new Error('PasswordStrength parts must be used within <PasswordStrength>');
  return strength;
}

interface PasswordStrengthProps extends React.ComponentProps<typeof Card> {
  strength: PasswordStrengthValue;
}

/**
 * How strong a password is and which of its requirements it meets, in a small `Card`. The caller
 * rates the password and owns every word; the root carries `strength` as `data-strength`:
 *
 *   <PasswordStrength strength="fair">
 *     <PasswordStrengthMeter valueText="Fair">Password strength</PasswordStrengthMeter>
 *     <PasswordStrengthRequirements>
 *       <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
 *     </PasswordStrengthRequirements>
 *   </PasswordStrength>
 */
function PasswordStrength({ strength, size = 'sm', ...props }: PasswordStrengthProps): React.ReactNode {
  return (
    <PasswordStrengthContext.Provider value={strength}>
      <Card data-slot="password-strength" data-strength={strength} size={size} {...props} />
    </PasswordStrengthContext.Provider>
  );
}

interface PasswordStrengthMeterProps extends Omit<
  React.ComponentProps<typeof Progress>,
  'value' | 'min' | 'max' | 'getAriaValueText' | 'children'
> {
  /** The meter's name, shown above its bar. */
  children: React.ReactNode;
  /** The strength in words, such as `Fair`: shown beside the name, read as the bar's value and announced when it changes. */
  valueText: string;
}

/**
 * Upstream's `Progress` with the root's strength as one step of three (weak), two (fair) or three
 * (strong), its children as the bar's name and `valueText` beside it and as the bar's value text. A
 * polite live region beside the bar reads `valueText` out each time it changes, which a progressbar's
 * own value text does not.
 */
function PasswordStrengthMeter({
  children,
  valueText,
  className,
  ...props
}: PasswordStrengthMeterProps): React.ReactNode {
  const strength = usePasswordStrength();
  return (
    <>
      <Progress
        data-slot="password-strength-meter"
        value={PASSWORD_STRENGTH_STEP[strength]}
        min={0}
        max={PASSWORD_STRENGTH_STEPS}
        getAriaValueText={() => valueText}
        className={cn('px-(--card-spacing)', className)}
        {...props}
      >
        <ProgressLabel>{children}</ProgressLabel>
        <ProgressValue>{() => valueText}</ProgressValue>
      </Progress>
      {/* A progressbar's children are presentational, so the live region sits beside it. */}
      <span role="status" aria-live="polite" className="sr-only">
        {valueText}
      </span>
    </>
  );
}

/** The list of requirements, one `PasswordStrengthRequirement` each. */
function PasswordStrengthRequirements({ className, ...props }: React.ComponentProps<'ul'>): React.ReactNode {
  return (
    <ul
      data-slot="password-strength-requirements"
      className={cn('flex flex-col gap-1 px-(--card-spacing)', className)}
      {...props}
    />
  );
}

interface PasswordStrengthRequirementProps extends React.ComponentProps<'li'> {
  /** Whether the password meets it; carried as `data-met`. */
  met?: boolean;
  /**
   * Read after the requirement while it is met; `Met` when omitted. A string, because a screen reader
   * reads it and the app translates it.
   */
  metLabel?: string;
  /**
   * Read after the requirement while it is not met; `Not met` when omitted. A string, because a screen
   * reader reads it and the app translates it.
   */
  unmetLabel?: string;
}

/**
 * One requirement: a circle-check and foreground text when met, a circle and muted text when not. The
 * icons are hidden from a screen reader, which hears `metLabel` or `unmetLabel` after the children
 * instead.
 */
function PasswordStrengthRequirement({
  met = false,
  metLabel = 'Met',
  unmetLabel = 'Not met',
  className,
  children,
  ...props
}: PasswordStrengthRequirementProps): React.ReactNode {
  return (
    <li
      data-slot="password-strength-requirement"
      data-met={met || undefined}
      className={cn('flex items-center gap-2 text-sm text-muted-foreground data-met:text-foreground', className)}
      {...props}
    >
      {met ? (
        <CircleCheckIcon aria-hidden size={16} className="text-foreground shrink-0" />
      ) : (
        <CircleIcon aria-hidden size={16} className="text-foreground shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        {children}
        <span className="sr-only">, {met ? metLabel : unmetLabel}</span>
      </span>
    </li>
  );
}

export { PasswordStrength, PasswordStrengthMeter, PasswordStrengthRequirements, PasswordStrengthRequirement };
export type { PasswordStrengthValue };
