import * as LabelPrimitive from '@rn-primitives/label';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { asText, isText, textOf } from '../lib/text-children';
import { cn } from '../lib/utils';
import { Separator } from './separator';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes behind that state, such as `@invalid` in an invalid Field; the
// registry build replaces each with the classes translated for the target engine.

/** The id a FieldSet is named by, which its FieldLegend takes as its nativeID. */
const FieldSetContext = createContext<string | undefined>(undefined);

/** Whether a FieldGroup sits inside another, which spaces its fields more tightly. */
const FieldGroupContext = createContext(false);

type FieldOrientation = 'vertical' | 'horizontal' | 'responsive';

/** What the parts of a Field read from it: how it lays them out, and whether it is disabled. */
const FieldContext = createContext<{ orientation: FieldOrientation; disabled: boolean }>({
  orientation: 'vertical',
  disabled: false,
});

/**
 * A set of related fields, a group named by its FieldLegend. A FieldDescription right after the legend
 * sits close under it; the rest are spaced apart by the style's gap.
 */
function FieldSet({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const legendId = useId();
  const items = Children.toArray(children);
  const isLegend = (child: ReactNode): boolean => isValidElement(child) && child.type === FieldLegend;
  const legends = items.filter(isLegend);
  const rest = items
    .filter((child) => !isLegend(child))
    .map((child, index) =>
      index === 0 &&
      legends.length > 0 &&
      isValidElement<{ className?: string }>(child) &&
      child.type === FieldDescription
        ? cloneElement(child, { className: cn('cn-field-description@after=legend', child.props.className) })
        : child,
    );

  return (
    <FieldSetContext.Provider value={legendId}>
      <View role="group" aria-labelledby={legends.length > 0 ? legendId : undefined} className={className} {...props}>
        {legends}
        <View className="cn-field-set flex-col">{rest}</View>
      </View>
    </FieldSetContext.Provider>
  );
}

type FieldLegendProps = ComponentProps<typeof Text> & {
  /** `legend` draws it at the base size, as a heading for the set; `label` at a field label's size. */
  variant?: 'legend' | 'label';
};

/** The name of a FieldSet, which the set is announced by. */
function FieldLegend({ className, variant = 'legend', ...props }: FieldLegendProps): ReactNode {
  const legendId = useContext(FieldSetContext);
  return (
    <Text
      nativeID={legendId}
      className={cn(
        'cn-field-legend cn-field-legend/text',
        variant === 'legend' ? 'cn-field-legend/text@variant=legend' : 'cn-field-legend/text@variant=label',
        className,
      )}
      {...props}
    />
  );
}

/** A column of Fields, spaced apart by the style's gap, or more tightly inside another FieldGroup. */
function FieldGroup({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const nested = useContext(FieldGroupContext);
  return (
    <FieldGroupContext.Provider value>
      <View
        className={cn('w-full flex-col cn-field-group', nested && 'cn-field-group@part=field-group', className)}
        {...props}
      />
    </FieldGroupContext.Provider>
  );
}

type FieldProps = ComponentProps<typeof View> & {
  /**
   * `vertical` stacks the label, the control and the description; `horizontal` sets them in a row, such
   * as a Switch beside its label; `responsive` stacks them, as upstream does below its breakpoint.
   */
  orientation?: FieldOrientation;
  /** Draws the field's label in the destructive colour. */
  invalid?: boolean;
  /** Dims the field's label and title; the control takes its own `disabled`. */
  disabled?: boolean;
};

/**
 * One form field, announced as a group: a FieldLabel, the control and a FieldDescription or a
 * FieldError, laid out by `orientation`. A horizontal Field holding a FieldContent aligns its children
 * to the top.
 */
function Field({
  className,
  orientation = 'vertical',
  invalid = false,
  disabled = false,
  children,
  ...props
}: FieldProps): ReactNode {
  const outer = useContext(TextClassContext);
  const context = useMemo(() => ({ orientation, disabled }), [orientation, disabled]);
  const holdsContent = Children.toArray(children).some((child) => isValidElement(child) && child.type === FieldContent);

  return (
    <FieldContext.Provider value={context}>
      <TextClassContext.Provider value={cn(outer, invalid && 'cn-field/text@invalid')}>
        <View
          role="group"
          className={cn(
            'w-full cn-field',
            orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
            orientation === 'horizontal' && holdsContent && 'items-start',
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </TextClassContext.Provider>
    </FieldContext.Provider>
  );
}

/** The label and description of a horizontal Field, beside its control. */
function FieldContent({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('flex-1 flex-col cn-field-content', className)} {...props} />;
}

type FieldLabelProps = Omit<LabelPrimitive.RootProps, 'children'> & {
  /** The label's text. */
  children: ReactNode;
  /** The id a control names in `aria-labelledby` to take this label's text as its name. */
  nativeID?: string;
};

/**
 * The Label of a Field, dimmed in a disabled Field and destructive in an invalid one. React Native has
 * no label-to-control link, so pressing it only runs `onPress`, which the caller points at the control's
 * `focus()`.
 */
function FieldLabel({ className, children, nativeID, ...props }: FieldLabelProps): ReactNode {
  const { orientation, disabled } = useContext(FieldContext);
  const outer = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(outer, 'cn-label/text', 'cn-field-label/text')}>
      <LabelPrimitive.Root
        className={cn(
          'cn-label cn-field-label',
          orientation === 'horizontal' ? 'flex-auto' : 'self-start',
          disabled && 'cn-field-label@disabled',
          className,
        )}
        {...props}
      >
        <Text asChild>
          <LabelPrimitive.Text nativeID={nativeID}>{children}</LabelPrimitive.Text>
        </Text>
      </LabelPrimitive.Root>
    </TextClassContext.Provider>
  );
}

/** A title in a Field that names content rather than a control, drawn as a label is; dimmed when disabled. */
function FieldTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { disabled } = useContext(FieldContext);
  return <Text className={cn('cn-field-title/text', disabled && 'cn-field-title@disabled', className)} {...props} />;
}

/** The muted help text of a Field or a FieldSet. */
function FieldDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text className={cn('cn-field-description/text', 'leading-normal', className)} {...props} />;
}

/** A rule between groups of fields, with optional text centred on it, such as Or continue with. */
function FieldSeparator({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View className={cn('relative justify-center cn-field-separator', className)} {...props}>
      <Separator className="absolute inset-x-0 top-1/2" />
      {children ? (
        <TextClassContext.Provider value="cn-field-separator/text cn-field-separator-content/text">
          <View className="bg-background cn-field-separator-content self-center">{asText(children)}</View>
        </TextClassContext.Provider>
      ) : null}
    </View>
  );
}

/** The mark before each message of a FieldError's list. */
const BULLET = '\u2022';

type FieldErrorProps = ComponentProps<typeof View> & {
  /** Errors from a form library; the messages are drawn once each, as a list when there are several. */
  errors?: ({ message?: string } | undefined)[];
};

/**
 * The error of a Field in the destructive colour: its children, or else the messages of `errors`. With
 * neither, it draws nothing. It carries the alert role, and a screen reader announces a text message when
 * it appears or changes: TalkBack through a polite live region, VoiceOver through an announcement.
 */
function FieldError({ className, children, errors, ...props }: FieldErrorProps): ReactNode {
  const messages = [...new Set((errors ?? []).flatMap((error) => (error?.message ? [error.message] : [])))];
  const announcement = isText(children) ? textOf(children) : children ? undefined : messages.join(' ');

  // A live region is Android's alone; iOS announces only what it is told to.
  useEffect(() => {
    if (announcement && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);

  let content: ReactNode = children;
  if (!content && messages.length === 1) content = messages[0];
  if (!content && messages.length > 1) {
    content = (
      <View role="list" className="ml-4 flex-col gap-1">
        {messages.map((message) => (
          <Text key={message} role="listitem">
            {`${BULLET} ${message}`}
          </Text>
        ))}
      </View>
    );
  }
  if (!content) return null;

  return (
    <TextClassContext.Provider value="cn-field-error/text">
      <View role="alert" accessibilityLiveRegion="polite" className={className} {...props}>
        {asText(content)}
      </View>
    </TextClassContext.Provider>
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
export type { FieldErrorProps, FieldLabelProps, FieldLegendProps, FieldProps };
