import { Brain, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ReasoningCollapsibleContext, useReasoningCollapsible } from '../../hooks/use-reasoning-collapsible';
import { usePulse } from '../../lib/motion';
import { asText } from '../../lib/text-children';
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
import { Icon } from '../../ui/icon';
import { Text, TextClassContext } from '../../ui/text';

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

const LABEL_LAYOUT = { flex: 1, minWidth: 0 } as const;

interface ReasoningCollapsibleProps extends Omit<CollapsibleProps, 'open' | 'defaultOpen'> {
  streaming?: boolean;
  /** The initial open state; defaults to `streaming`. `false` also keeps a stream from opening it. */
  defaultOpen?: boolean;
}

/**
 * ReasoningCollapsible - a thinking / reasoning disclosure. It opens while `streaming` is true and closes
 * itself once about a second after the stream ends. The label and the body are the consumer's;
 * `useReasoningCollapsible` (`hooks/use-reasoning-collapsible`) hands the label its timing:
 *
 *   function ReasoningLabel() {
 *     const { streaming, duration } = useReasoningCollapsible();
 *     return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
 *   }
 *
 *   <ReasoningCollapsible streaming={isLive}>
 *     <ReasoningCollapsibleTrigger><ReasoningLabel /></ReasoningCollapsibleTrigger>
 *     <ReasoningCollapsibleContent><Text>{text}</Text></ReasoningCollapsibleContent>
 *   </ReasoningCollapsible>
 */
function ReasoningCollapsible({
  streaming = false,
  defaultOpen,
  onOpenChange,
  ...props
}: ReasoningCollapsibleProps): ReactNode {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? streaming);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const startRef = useRef<number | null>(null);
  const everStreamedRef = useRef(streaming);
  const autoClosedRef = useRef(false);

  useEffect(() => {
    if (streaming) {
      everStreamedRef.current = true;
      if (startRef.current === null) startRef.current = Date.now();
    } else if (startRef.current !== null) {
      setDuration(Math.ceil((Date.now() - startRef.current) / MS_IN_S));
      startRef.current = null;
    }
  }, [streaming]);

  useEffect(() => {
    if (streaming && !isOpen && defaultOpen !== false) setIsOpen(true);
  }, [streaming, isOpen, defaultOpen]);

  // Closes once only, so a reader who reopens old reasoning keeps it open.
  useEffect(() => {
    if (everStreamedRef.current && !streaming && isOpen && !autoClosedRef.current) {
      const t = setTimeout(() => {
        setIsOpen(false);
        autoClosedRef.current = true;
      }, AUTO_CLOSE_DELAY);
      return (): void => clearTimeout(t);
    }
    return undefined;
  }, [streaming, isOpen]);

  return (
    <ReasoningCollapsibleContext.Provider value={{ streaming, isOpen, duration }}>
      <Collapsible
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          onOpenChange?.(open);
        }}
        {...props}
      />
    </ReasoningCollapsibleContext.Provider>
  );
}

type ReasoningCollapsibleTriggerProps = Omit<CollapsibleTriggerProps, 'asChild' | 'children'> & {
  /** The label, set in one line of Text. */
  children?: ReactNode;
};

/**
 * The toggle row, a full-width small ghost Button announced as a button with its expanded state; its
 * children are the label, set in one line of Text, so a label component may return a string. The label
 * pulses while the root is streaming, unless the system asks for reduced motion, and the chevron points up
 * while the body is open.
 * @throws {Error} when rendered outside a ReasoningCollapsible
 */
function ReasoningCollapsibleTrigger({ className, children, ...props }: ReasoningCollapsibleTriggerProps): ReactNode {
  const { streaming, isOpen } = useReasoningCollapsible();
  const pulseStyle = usePulse(streaming);
  return (
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" className={cn('w-full justify-start', className)} {...props}>
        <Icon as={Brain} />
        {/* The pulse runs on a layer around the label, as StatusIndicator's does, so the label stays a plain
            Text that both engines style; the layer grows in the row as the web's label does. */}
        <Animated.View style={[LABEL_LAYOUT, pulseStyle]}>
          <Text numberOfLines={1} className="text-left">
            {children}
          </Text>
        </Animated.View>
        <Icon as={isOpen ? ChevronUp : ChevronDown} />
      </Button>
    </CollapsibleTrigger>
  );
}

/**
 * The reasoning body, in small muted text under the trigger; unmounted while closed. A string child is set
 * in a Text.
 */
function ReasoningCollapsibleContent({ className, children, ...props }: CollapsibleContentProps): ReactNode {
  const textClass = useContext(TextClassContext);
  return (
    <CollapsibleContent className={cn('mt-2', className)} {...props}>
      <TextClassContext.Provider value={cn(textClass, 'text-muted-foreground text-sm')}>
        <View>{asText(children)}</View>
      </TextClassContext.Provider>
    </CollapsibleContent>
  );
}

export { ReasoningCollapsible, ReasoningCollapsibleTrigger, ReasoningCollapsibleContent };
export type { ReasoningCollapsibleProps };
