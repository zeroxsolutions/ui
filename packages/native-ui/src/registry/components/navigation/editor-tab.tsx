import { createContext, useContext, useRef, type ComponentProps, type ReactNode } from 'react';
import { XIcon } from '../../icons/lucide/x-icon';
import { iconTrigger, type IconHandle } from '../../lib/icon-motion';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Item, ItemTitle } from '../../ui/item';
import { UnsavedIndicator } from '../feedback/unsaved-indicator';

/** Whether the tab is active and dirty, which the web reads off the root's `data-active` and `data-dirty`. */
const EditorTabContext = createContext({ active: false, dirty: false });

type EditorTabProps = Omit<ComponentProps<typeof Item>, 'variant' | 'size'> & {
  /** The tab of the document on show. */
  active?: boolean;
  /** The document has unsaved changes. */
  dirty?: boolean;
};

/**
 * One tab in an editor's tab strip, an outline extra-small Item as wide as its content. Compose the parts inside
 * `ItemContent` and `ItemActions`:
 *
 *   <EditorTab active dirty>
 *     <ItemContent><EditorTabTitle>page.tsx</EditorTabTitle></ItemContent>
 *     <ItemActions><EditorTabCloseButton aria-label="Close page.tsx" onPress={close} /></ItemActions>
 *   </EditorTab>
 */
function EditorTab({ active = false, dirty = false, className, ...props }: EditorTabProps): ReactNode {
  return (
    <EditorTabContext.Provider value={{ active, dirty }}>
      <Item variant="outline" size="xs" className={cn('w-auto self-start', className)} {...props} />
    </EditorTabContext.Provider>
  );
}

/** The document's name, muted until its tab is active. */
function EditorTabTitle({ className, ...props }: ComponentProps<typeof ItemTitle>): ReactNode {
  const { active } = useContext(EditorTabContext);
  return <ItemTitle className={cn('text-muted-foreground', active && 'text-foreground', className)} {...props} />;
}

/**
 * The tab's trailing close control, a ghost extra-small icon Button named "Close" unless an `aria-label` is
 * given. Its X shows at all times, since a phone has no hover to reveal it; on a dirty tab that is not active,
 * the unsaved dot sits before it, where the web shows the dot in the X's place until the tab is hovered. A press
 * goes to the innermost pressable alone, so closing a tab does not also activate it. The X plays when the button
 * is pressed in or focused, after a caller's own `onPressIn` and `onFocus`.
 */
function EditorTabCloseButton({
  onPressIn,
  onFocus,
  ...props
}: Omit<ComponentProps<typeof Button>, 'children'>): ReactNode {
  const { active, dirty } = useContext(EditorTabContext);
  const icon = useRef<IconHandle>(null);
  return (
    <>
      {dirty && !active && <UnsavedIndicator />}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Close"
        {...iconTrigger([icon], { onPressIn, onFocus })}
        {...props}
      >
        <Icon as={XIcon} ref={icon} />
      </Button>
    </>
  );
}

export { EditorTab, EditorTabTitle, EditorTabCloseButton };
export type { EditorTabProps };
