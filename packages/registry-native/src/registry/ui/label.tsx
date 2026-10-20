import * as LabelPrimitive from '@rn-primitives/label';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Text, TextClassContext } from './text';

type LabelProps = Omit<LabelPrimitive.RootProps, 'children'> & {
  /** The label's text. */
  children: ReactNode;
  /** The id an input names in `aria-labelledby` to take this label's text as its name. */
  nativeID?: string;
  /** Dims the label to match a disabled field; it does not block presses. */
  disabled?: boolean;
};

/**
 * The text that names a field. React Native has no label-to-input link of its own, so pressing a
 * Label only runs its `onPress`, which the caller points at the field's `focus()`.
 */
function Label({ className, children, nativeID, disabled, ...props }: LabelProps): ReactNode {
  return (
    <TextClassContext.Provider value="cn-label/text">
      <LabelPrimitive.Root className={cn('cn-label', disabled && 'cn-label@disabled', className)} {...props}>
        <Text asChild>
          <LabelPrimitive.Text nativeID={nativeID}>{children}</LabelPrimitive.Text>
        </Text>
      </LabelPrimitive.Root>
    </TextClassContext.Provider>
  );
}

export { Label };
export type { LabelProps };
