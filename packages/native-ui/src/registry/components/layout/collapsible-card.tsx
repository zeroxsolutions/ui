import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { asText, textOf } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  type CollapsibleContentProps,
  type CollapsibleProps,
  type CollapsibleTriggerProps,
} from '../../ui/collapsible';
import { Icon, IconClassContext } from '../../ui/icon';
import { TextClassContext } from '../../ui/text';

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/text` for its text classes; the
// registry build replaces each with the classes translated for the target engine.
const collapsibleCardVariants = cva('cn-collapsible-card w-full flex-col overflow-hidden', {
  variants: {
    variant: {
      default: 'cn-collapsible-card-surface bg-card',
      muted: 'cn-collapsible-card-muted bg-muted/50',
      plain: 'border-b border-border',
      flush: '',
    },
  },
  defaultVariants: { variant: 'default' },
});

type CollapsibleCardVariant = NonNullable<VariantProps<typeof collapsibleCardVariants>['variant']>;

interface CollapsibleCardContextValue {
  variant: CollapsibleCardVariant;
  open: boolean;
}

/**
 * The card's variant and whether it is open, which the web reads off the root's `data-variant` and the
 * trigger's `aria-expanded` through group selectors a device has no counterpart of.
 */
const CollapsibleCardContext = createContext<CollapsibleCardContextValue>({
  variant: 'default',
  open: true,
});

type CollapsibleCardProps = CollapsibleProps & VariantProps<typeof collapsibleCardVariants>;

/**
 * A header over a collapsible body, open by default. Compose `CollapsibleCardHeader` (holding
 * `CollapsibleCardTitle` and `CollapsibleCardActions`, where `CollapsibleCardTrigger` usually sits) above
 * `CollapsibleCardContent`. `variant` picks the surface: `default` the card surface, `muted` a borderless
 * fill for a block nested in another card, `plain` no surface and a rule underneath, for a titled group of
 * rows in a panel, `flush` no surface at all, for a block filling a surface its container draws. `default`
 * and `muted` rule the body off from the header, on the body, so the header keeps its height as the card
 * opens and closes. It holds its own open state from `defaultOpen`, or follows `open` when given it.
 */
function CollapsibleCard({
  className,
  variant,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  ...props
}: CollapsibleCardProps): ReactNode {
  const surface = variant ?? 'default';
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const textClass = useContext(TextClassContext);

  return (
    <CollapsibleCardContext.Provider value={{ variant: surface, open }}>
      <TextClassContext.Provider
        value={cn(textClass, 'cn-collapsible-card/text', surface === 'default' && 'text-card-foreground')}
      >
        <Collapsible
          open={open}
          onOpenChange={(next) => {
            setUncontrolledOpen(next);
            onOpenChange?.(next);
          }}
          className={cn(collapsibleCardVariants({ variant: surface }), className)}
          {...props}
        />
      </TextClassContext.Provider>
    </CollapsibleCardContext.Provider>
  );
}

/**
 * The row above the body: a title, and the actions pushed to the far end when it holds a
 * `CollapsibleCardActions`.
 */
function CollapsibleCardHeader({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const { variant } = useContext(CollapsibleCardContext);
  const holdsActions = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === CollapsibleCardActions,
  );
  return (
    <View
      className={cn(
        'cn-collapsible-card-header flex-row items-center gap-1.5',
        variant === 'plain' && 'px-2.5',
        holdsActions && 'justify-between',
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * The header's muted title, as tall as the style's icon button so the header is one height whether or not
 * it holds actions. A string child is set in a Text, and an Icon in it with no size of its own is drawn at
 * `size-4` as its leading icon.
 */
function CollapsibleCardTitle({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const textClass = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(textClass, 'text-muted-foreground font-sans-medium')}>
      <IconClassContext.Provider value="size-4 shrink-0">
        <View className={cn('cn-collapsible-card-title min-w-0 flex-row items-center gap-1.5', className)} {...props}>
          {asText(children, { numberOfLines: 1 })}
        </View>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

/** The header's trailing controls, such as a copy button and the `CollapsibleCardTrigger`. */
function CollapsibleCardActions({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('flex-row items-center gap-0.5', className)} {...props} />;
}

type CollapsibleCardTriggerProps = Omit<CollapsibleTriggerProps, 'asChild' | 'children'> & {
  /** What replaces the chevron; its text names the button. */
  children?: ReactNode;
};

/**
 * The ghost icon Button that opens and closes the body, announced as a button with its expanded state. With
 * no `children` it shows a chevron, pointing up while the body is open. `children` replace the chevron, and
 * text in them names the button; without text, such as the chevron or an icon alone, it is named "Toggle
 * content" unless an `aria-label` is given.
 */
function CollapsibleCardTrigger({ className, children, ...props }: CollapsibleCardTriggerProps): ReactNode {
  const { open } = useContext(CollapsibleCardContext);
  const named = textOf(children).trim() !== '';
  return (
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        aria-label={named ? undefined : 'Toggle content'}
        className={className}
        {...props}
      >
        {asText(children) ?? <Icon as={open ? ChevronUp : ChevronDown} />}
      </Button>
    </CollapsibleTrigger>
  );
}

/**
 * The body that the trigger opens and closes; unmounted while closed unless `keepMounted`. It pads nothing,
 * and a string child is set in a Text.
 */
function CollapsibleCardContent({ className, children, ...props }: CollapsibleContentProps): ReactNode {
  const { variant } = useContext(CollapsibleCardContext);
  return (
    <CollapsibleContent
      className={cn(
        'overflow-hidden',
        (variant === 'default' || variant === 'muted') && 'border-border border-t',
        className,
      )}
      {...props}
    >
      {asText(children)}
    </CollapsibleContent>
  );
}

export {
  CollapsibleCard,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardActions,
  CollapsibleCardTrigger,
  CollapsibleCardContent,
  collapsibleCardVariants,
};
export type { CollapsibleCardProps };
