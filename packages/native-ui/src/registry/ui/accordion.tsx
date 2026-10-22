import * as AccordionPrimitive from '@rn-primitives/accordion';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Children, createContext, isValidElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useReducedMotion } from '../lib/motion';
import { cn } from '../lib/utils';
import { Icon, IconClassContext } from './icon';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

/** Whether an AccordionItem is the last of its Accordion, which draws no border under it. */
const LastItemContext = createContext(false);

/** Upstream's `accordion-down` and `accordion-up`: 0.2s, CSS's `ease-out`. */
const PANEL_MOTION = { duration: 200, easing: Easing.bezier(0, 0, 0.58, 1) } as const;

type AccordionProps = Omit<
  AccordionPrimitive.RootProps,
  'type' | 'value' | 'defaultValue' | 'onValueChange' | 'collapsible'
> & {
  /** The values of the open items. Give it to control the Accordion; leave it out to let it hold its own. */
  value?: string[];
  /** The values of the items open at first, when `value` is left out. */
  defaultValue?: string[];
  /** Called with the values of the open items after a press opens or closes one. */
  onValueChange?: (value: string[]) => void;
  /** Lets several items be open at once; otherwise opening one closes the one that was open. */
  multiple?: boolean;
};

/**
 * A stack of AccordionItem sections, each opened and closed by its trigger. One item is open at a time
 * unless `multiple`, and pressing an open item's trigger closes it. It holds its own open items from
 * `defaultValue`, or follows `value` and reports each press through `onValueChange`. A `disabled`
 * Accordion ignores every press.
 */
function Accordion({
  className,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  multiple = false,
  children,
  ...props
}: AccordionProps): ReactNode {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = valueProp ?? uncontrolledValue;
  const items = Children.toArray(children);

  // The primitive always holds every open item, so a value it is given is never one it reads as its own
  // state; a single Accordion keeps only the item a press has just opened.
  const handleValueChange = (next: string[]): void => {
    const changed = multiple ? next : next.filter((item) => !value.includes(item));
    setUncontrolledValue(changed);
    onValueChange?.(changed);
  };

  return (
    <AccordionPrimitive.Root
      type="multiple"
      collapsible
      value={value}
      onValueChange={handleValueChange}
      className={cn('w-full flex-col', className)}
      {...props}
    >
      {items.map((child, index) => (
        <LastItemContext.Provider key={isValidElement(child) ? child.key : index} value={index === items.length - 1}>
          {child}
        </LastItemContext.Provider>
      ))}
    </AccordionPrimitive.Root>
  );
}

type AccordionItemProps = AccordionPrimitive.ItemProps;

/**
 * One section of an Accordion, named by its `value`, holding an AccordionTrigger and an
 * AccordionContent. Every item but the last draws a border under it. A `disabled` item ignores presses
 * on its trigger.
 */
function AccordionItem({ className, ...props }: AccordionItemProps): ReactNode {
  const last = useContext(LastItemContext);
  return (
    <AccordionPrimitive.Item className={cn(!last && 'cn-accordion-item@position=not-last', className)} {...props} />
  );
}

type AccordionTriggerProps = Omit<AccordionPrimitive.TriggerProps, 'children'> & {
  /** The section's title, as a Text; the chevron is drawn after it. */
  children?: ReactNode;
};

/**
 * The control that opens and closes its item, announced as a button with its expanded and disabled
 * state, inside a heading. Its Text child names it and wraps beside the chevron, which points down while
 * the item is closed and up while it is open. A disabled trigger is dimmed.
 */
function AccordionTrigger({ className, children, disabled, ...props }: AccordionTriggerProps): ReactNode {
  const root = AccordionPrimitive.useRootContext();
  const item = AccordionPrimitive.useItemContext();
  const dimmed = disabled === true || root.disabled === true || item.disabled === true;

  return (
    <AccordionPrimitive.Header className="flex-row">
      <TextClassContext.Provider value="flex-1 cn-accordion-trigger/text">
        <AccordionPrimitive.Trigger
          className={cn(
            'relative flex-1 flex-row items-start justify-between border border-transparent cn-accordion-trigger',
            dimmed && 'opacity-50',
            className,
          )}
          disabled={disabled}
          {...props}
        >
          {children}
          {/* The label's text classes would stretch and recolour the chevron, so it reads none of them. */}
          <TextClassContext.Provider value={undefined}>
            <IconClassContext.Provider value="shrink-0 cn-accordion-trigger/icon">
              <Icon as={item.isExpanded ? ChevronUp : ChevronDown} />
            </IconClassContext.Provider>
          </TextClassContext.Provider>
        </AccordionPrimitive.Trigger>
      </TextClassContext.Provider>
    </AccordionPrimitive.Header>
  );
}

type AccordionContentProps = Omit<AccordionPrimitive.ContentProps, 'forceMount'>;

/**
 * The section's body, shown while its item is open and not rendered while it is closed. It grows from
 * no height to its own over 200ms as the item opens and shrinks back as it closes, or appears and goes
 * at once when the system asks for reduced motion. Its `className` goes on the padded box around its
 * children, whose Text takes the style's body size.
 */
function AccordionContent({ className, children, onLayout, ...props }: AccordionContentProps): ReactNode {
  const { isExpanded } = AccordionPrimitive.useItemContext();
  const reduced = useReducedMotion();
  // Rendered while open and while the close runs; removed once it has.
  const [mounted, setMounted] = useState(isExpanded);
  const progress = useSharedValue(isExpanded ? 1 : 0);
  // The height the content lays itself out at, which the clip grows to; -1 until it has been laid out.
  const contentHeight = useSharedValue(-1);

  useEffect(() => {
    const target = isExpanded ? 1 : 0;
    if (isExpanded) setMounted(true);
    if (reduced) {
      progress.value = target;
      if (!isExpanded) setMounted(false);
      return;
    }
    progress.value = withTiming(target, PANEL_MOTION, (finished) => {
      if (finished === true && target === 0) scheduleOnRN(setMounted, false);
    });
  }, [isExpanded, reduced, progress]);

  const clipStyle = useAnimatedStyle(() => {
    if (contentHeight.value < 0) return progress.value === 1 ? {} : { height: 0 };
    return { height: contentHeight.value * progress.value };
  });

  if (!mounted && !isExpanded) return null;

  return (
    <Animated.View style={[{ overflow: 'hidden' }, clipStyle]}>
      <TextClassContext.Provider value="cn-accordion-content/text">
        <AccordionPrimitive.Content
          forceMount
          className="cn-accordion-content"
          aria-hidden={!isExpanded}
          onLayout={(event: LayoutChangeEvent) => {
            contentHeight.value = event.nativeEvent.layout.height;
            onLayout?.(event);
          }}
          {...props}
        >
          <View className={cn('cn-accordion-content-inner', className)}>{children}</View>
        </AccordionPrimitive.Content>
      </TextClassContext.Provider>
    </Animated.View>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
export type { AccordionContentProps, AccordionItemProps, AccordionProps, AccordionTriggerProps };
