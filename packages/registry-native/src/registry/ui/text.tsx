import { Slot } from '@rn-primitives/slot';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { Text as NativeText } from 'react-native';
import { cn } from '../lib/utils';

/**
 * The text classes a container hands every Text inside it, such as a Button's
 * label colour. Text merges them over its own and under its `className`.
 */
const TextClassContext = createContext<string | undefined>(undefined);

type TextProps = ComponentProps<typeof NativeText> & {
  /** Renders the single child in place of a native Text, with Text's props and classes merged onto it. */
  asChild?: boolean;
};

function Text({ className, asChild = false, ...props }: TextProps): ReactNode {
  const textClass = useContext(TextClassContext);
  const Component = asChild ? Slot : NativeText;

  return <Component className={cn('font-sans text-foreground text-base', textClass, className)} {...props} />;
}

export { Text, TextClassContext };
export type { TextProps };
