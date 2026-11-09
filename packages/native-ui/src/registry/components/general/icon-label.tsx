import * as LabelPrimitive from '@rn-primitives/label';
import { useContext, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { IconClassContext } from '../../ui/icon';
import { TextClassContext } from '../../ui/text';

type IconLabelProps = LabelPrimitive.RootProps & {
  /**
   * The field's name in words, which the icon stands in for: what a screen reader reads for the label, in
   * place of the web's `sr-only` text.
   */
  'aria-label': string;
  /** The id an input names in `aria-labelledby` to take this label's name as its own. */
  nativeID?: string;
};

/**
 * An icon standing in for a field's text label in a dense panel. React Native has no label-to-input link
 * of its own, so in place of the web's `htmlFor` it takes the `nativeID` the input names in
 * `aria-labelledby`, and pressing it runs its `onPress`, which the caller points at the input's `focus()`.
 * iOS does not read `aria-labelledby`, so the input carries the same words in its own `aria-label` too.
 * A tooltip composed around it shows the words when it is pressed, which then no longer focuses the input:
 *
 *   <Tooltip>
 *     <TooltipTrigger asChild>
 *       <IconLabel aria-label="Rotation" nativeID="rotation">
 *         <Icon as={RotateCw} />
 *       </IconLabel>
 *     </TooltipTrigger>
 *     <TooltipContent><Text>Rotation</Text></TooltipContent>
 *   </Tooltip>
 *   <Input aria-label="Rotation" aria-labelledby="rotation" keyboardType="numeric" />
 *
 * An Icon inside it with no `size-*` class of its own is drawn at `size-3`, in the muted foreground.
 */
function IconLabel({ className, ...props }: IconLabelProps): ReactNode {
  const textClass = useContext(TextClassContext);

  return (
    <TextClassContext.Provider value={cn(textClass, 'text-muted-foreground')}>
      <IconClassContext.Provider value="size-3">
        <LabelPrimitive.Root className={cn('flex-row items-center', className)} {...props} />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export { IconLabel };
export type { IconLabelProps };
