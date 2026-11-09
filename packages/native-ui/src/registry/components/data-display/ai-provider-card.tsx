import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import { useFocusVisible } from '../../lib/focus-visible';
import { cn } from '../../lib/utils';
import { Card, CardDescription } from '../../ui/card';
import { Text, TextClassContext } from '../../ui/text';
import { StatusIndicator, type StatusTone } from '../feedback/status-indicator';

/** Whether a press on the card outside its trigger is down, which the trigger draws as its own. */
const AiProviderCardPressedContext = createContext(false);

/**
 * A tile for one AI provider in an overview grid, the small Card unless given another `size`. Compose a
 * `CardHeader` holding `CardTitle` and an `AiProviderCardDescription`, a `CardFooter` holding an
 * `AiProviderCardLabel` and an `AiProviderCardAction`, and, when the tile selects, an `AiProviderCardTrigger`
 * as its direct child. A press anywhere on the card selects it, but on a control inside an
 * `AiProviderCardAction`, which takes the press itself.
 */
function AiProviderCard({ size = 'sm', className, children, ...props }: ComponentProps<typeof Card>): ReactNode {
  const [pressed, setPressed] = useState(false);
  const trigger = Children.toArray(children).find(
    (child): child is ReactElement<AiProviderCardTriggerProps> =>
      isValidElement(child) && child.type === AiProviderCardTrigger,
  );
  const card = (
    <Card size={size} className={cn('relative h-full', className)} {...props}>
      {children}
    </Card>
  );
  if (trigger === undefined) return card;

  // A view stacks above its siblings only, so a control in the footer cannot rise above a trigger laid over
  // the card as the web's does. The trigger lies under the card's content instead, and this press area
  // around the card takes a press that lands on the content, which a control inside the content keeps for
  // itself. It is not an accessibility element, so the trigger and the controls stay ones of their own.
  return (
    <AiProviderCardPressedContext.Provider value={pressed}>
      <Pressable
        accessible={false}
        disabled={trigger.props.disabled === true}
        onPress={trigger.props.onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        className="h-full"
      >
        {card}
      </Pressable>
    </AiProviderCardPressedContext.Provider>
  );
}

/** The provider blurb, on at most two lines. */
function AiProviderCardDescription(props: ComponentProps<typeof CardDescription>): ReactNode {
  return <CardDescription numberOfLines={2} {...props} />;
}

type AiProviderCardLabelProps = ComponentProps<typeof View> & {
  /** The status a dot before the note reports; omit for a note with no dot. */
  tone?: StatusTone;
};

/**
 * The footer note, such as a model count or an attention message, in small muted text on one line. Given a
 * `tone`, a `StatusIndicator` before it carries the status, so the note reads the same at any tone. A string
 * child is set in a Text.
 */
function AiProviderCardLabel({ tone, className, children, ...props }: AiProviderCardLabelProps): ReactNode {
  const textClass = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(textClass, 'text-muted-foreground text-xs')}>
      <View className={cn('min-w-0 shrink flex-row items-center gap-1.5', className)} {...props}>
        {tone && <StatusIndicator tone={tone} />}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text numberOfLines={1} className="shrink">
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </TextClassContext.Provider>
  );
}

/** A control inside the card, such as a `Switch`, which takes a press itself, so pressing it does not select the card. */
function AiProviderCardAction({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('relative z-20', className)} {...props} />;
}

type AiProviderCardTriggerProps = ComponentProps<typeof Pressable>;

/**
 * The button that selects the card, covering it under its content, so a screen reader and a keyboard reach the
 * card as one button; give it an `aria-label` naming the provider. Pressing the card draws a hairline inside its
 * edge, and keyboard focus a wider ring.
 */
function AiProviderCardTrigger({
  className,
  onPressIn,
  onPressOut,
  onFocus,
  onBlur,
  ...props
}: AiProviderCardTriggerProps): ReactNode {
  const cardPressed = useContext(AiProviderCardPressedContext);
  const [pressed, setPressed] = useState(false);
  const focus = useFocusVisible();
  return (
    <Pressable
      role="button"
      className={cn(
        'cn-ai-provider-card-trigger absolute inset-0 -z-10',
        (pressed || cardPressed) && 'border-foreground/20 border',
        focus.focusVisible && 'border-ring/50 border-[3px]',
        className,
      )}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      onFocus={(event) => {
        focus.onFocus(event);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.onBlur();
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

export { AiProviderCard, AiProviderCardAction, AiProviderCardDescription, AiProviderCardLabel, AiProviderCardTrigger };
export type { AiProviderCardLabelProps, AiProviderCardTriggerProps };
