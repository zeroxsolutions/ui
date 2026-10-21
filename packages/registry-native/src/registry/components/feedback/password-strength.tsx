import { Circle, CircleCheck } from 'lucide-react-native';
import { createContext, useContext, useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { Card, CardContent } from '../../ui/card';
import { Icon } from '../../ui/icon';
import { Progress } from '../../ui/progress';
import { Text } from '../../ui/text';
import { cn } from '../../lib/utils';

/** How strong the password is, from the caller's own check. */
type PasswordStrengthValue = 'weak' | 'fair' | 'strong';

/** The meter's fill for each strength, out of 100: one step of three, two or three. */
const PASSWORD_STRENGTH_FILL: Record<PasswordStrengthValue, number> = { weak: 33, fair: 67, strong: 100 };

const PasswordStrengthContext = createContext<PasswordStrengthValue | null>(null);

function usePasswordStrength(): PasswordStrengthValue {
  const strength = useContext(PasswordStrengthContext);
  if (strength === null) throw new Error('PasswordStrength parts must be used within <PasswordStrength>');
  return strength;
}

type PasswordStrengthProps = ComponentProps<typeof Card> & {
  strength: PasswordStrengthValue;
};

/**
 * How strong a password is and which of its requirements it meets, in a small Card. The caller rates
 * the password and owns every word:
 *
 *   <PasswordStrength strength="fair">
 *     <PasswordStrengthMeter valueText="Fair">Password strength</PasswordStrengthMeter>
 *     <PasswordStrengthRequirements>
 *       <PasswordStrengthRequirement met>At least 15 characters</PasswordStrengthRequirement>
 *     </PasswordStrengthRequirements>
 *   </PasswordStrength>
 */
function PasswordStrength({ strength, size = 'sm', ...props }: PasswordStrengthProps): ReactNode {
  return (
    <PasswordStrengthContext.Provider value={strength}>
      <Card size={size} {...props} />
    </PasswordStrengthContext.Provider>
  );
}

type PasswordStrengthMeterProps = Omit<ComponentProps<typeof CardContent>, 'children'> & {
  /** The meter's name: shown above the bar and what a screen reader calls the bar. */
  children: string;
  /** The strength in words, such as `Fair`: shown beside the name, read as the bar's value and announced when it changes. */
  valueText: string;
};

/**
 * A progress bar filled a third for `weak`, two thirds for `fair` and full for `strong`, with its name
 * and `valueText` above it. `valueText` is the bar's value text and sits in a polite live region;
 * when it changes after the first render it is also announced with AccessibilityInfo, which the live
 * region alone does not do on iOS.
 * @throws {Error} when rendered outside a PasswordStrength
 */
function PasswordStrengthMeter({ children, valueText, className, ...props }: PasswordStrengthMeterProps): ReactNode {
  const strength = usePasswordStrength();
  const announced = useRef(valueText);

  useEffect(() => {
    if (announced.current === valueText) return;
    announced.current = valueText;
    AccessibilityInfo.announceForAccessibility(valueText);
  }, [valueText]);

  return (
    <CardContent className={cn('gap-2', className)} {...props}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="font-sans-medium text-sm">{children}</Text>
        <Text accessibilityLiveRegion="polite" className="text-muted-foreground text-sm">
          {valueText}
        </Text>
      </View>
      <Progress
        aria-label={children}
        value={PASSWORD_STRENGTH_FILL[strength]}
        getValueLabel={() => valueText}
        className="h-1"
      />
    </CardContent>
  );
}

/** The list of requirements, one PasswordStrengthRequirement each. */
function PasswordStrengthRequirements({ className, ...props }: ComponentProps<typeof CardContent>): ReactNode {
  return <CardContent className={cn('gap-1', className)} {...props} />;
}

type PasswordStrengthRequirementProps = ComponentProps<typeof View> & {
  /** Whether the password meets it. */
  met?: boolean;
  /** Read after the requirement while it is met. A string, because a screen reader reads it and the app translates it. */
  metLabel?: string;
  /** Read after the requirement while it is not met. A string, because a screen reader reads it and the app translates it. */
  unmetLabel?: string;
  /** The requirement, as text. */
  children: string;
};

/**
 * One requirement: a check and foreground text while met, a circle and muted text while not. It is
 * one element for a screen reader, whose value text is `metLabel` or `unmetLabel`, so the state is
 * heard after the requirement.
 */
function PasswordStrengthRequirement({
  met = false,
  metLabel = 'Met',
  unmetLabel = 'Not met',
  className,
  children,
  ...props
}: PasswordStrengthRequirementProps): ReactNode {
  return (
    <View
      accessible
      accessibilityValue={{ text: met ? metLabel : unmetLabel }}
      className={cn('flex-row items-center gap-2', className)}
      {...props}
    >
      <Icon as={met ? CircleCheck : Circle} className="text-foreground size-4 shrink-0" />
      <Text className={cn('min-w-0 flex-1 text-sm', met ? 'text-foreground' : 'text-muted-foreground')}>
        {children}
      </Text>
    </View>
  );
}

export { PasswordStrength, PasswordStrengthMeter, PasswordStrengthRequirement, PasswordStrengthRequirements };
export type {
  PasswordStrengthMeterProps,
  PasswordStrengthProps,
  PasswordStrengthRequirementProps,
  PasswordStrengthValue,
};
