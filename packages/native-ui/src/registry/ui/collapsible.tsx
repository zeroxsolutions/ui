import * as CollapsiblePrimitive from '@rn-primitives/collapsible';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { cn } from '../lib/utils';

/** Whether the Collapsible around a CollapsibleContent is open; the primitive does not publish it. */
const CollapsibleOpenContext = createContext(false);

type CollapsibleProps = CollapsiblePrimitive.RootProps;

/**
 * A region a CollapsibleTrigger shows and hides. It holds its own open state from `defaultOpen`, or
 * follows `open` when given it; either way each press is reported through `onOpenChange`. A
 * `disabled` Collapsible ignores presses on its trigger. It draws nothing of its own.
 */
function Collapsible({ open: openProp, defaultOpen = false, onOpenChange, ...props }: CollapsibleProps): ReactNode {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  return (
    <CollapsibleOpenContext.Provider value={open}>
      <CollapsiblePrimitive.Root
        open={open}
        onOpenChange={(next) => {
          setUncontrolledOpen(next);
          onOpenChange?.(next);
        }}
        {...props}
      />
    </CollapsibleOpenContext.Provider>
  );
}

type CollapsibleTriggerProps = CollapsiblePrimitive.TriggerProps;

/**
 * The control that opens and closes its Collapsible, announced as a button with its expanded and
 * disabled state. Its Text children name it. Pass `asChild` to make a Button the trigger.
 */
function CollapsibleTrigger(props: CollapsibleTriggerProps): ReactNode {
  return <CollapsiblePrimitive.Trigger {...props} />;
}

type CollapsibleContentProps = Omit<CollapsiblePrimitive.ContentProps, 'forceMount'> & {
  /** Keeps the content rendered, hidden, while closed, so the state inside it survives closing. */
  keepMounted?: boolean;
};

/**
 * The region shown while its Collapsible is open. A closed one is not rendered unless `keepMounted`.
 * It opens and closes at once, without motion, as upstream's does.
 */
function CollapsibleContent({ className, keepMounted = false, ...props }: CollapsibleContentProps): ReactNode {
  const open = useContext(CollapsibleOpenContext);
  // On the web the primitive's Radix content sets `hidden` on a kept closed panel; on a device it
  // would stay drawn and in the accessibility tree.
  const hiddenOnDevice = Platform.OS !== 'web' && keepMounted && !open;

  return (
    <CollapsiblePrimitive.Content
      className={cn(hiddenOnDevice && 'hidden', className)}
      forceMount={keepMounted || undefined}
      aria-hidden={hiddenOnDevice || undefined}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
export type { CollapsibleContentProps, CollapsibleProps, CollapsibleTriggerProps };
