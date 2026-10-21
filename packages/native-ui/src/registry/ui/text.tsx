import { Slot } from '@rn-primitives/slot';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { Text as NativeText } from 'react-native';
import { cn } from '../lib/utils';

/**
 * The text classes a container hands every Text inside it, such as a Button's
 * label colour. Text merges them over its own and under its `className`.
 */
const TextClassContext = createContext<string | undefined>(undefined);

/** The Geist family class each weight name draws, because Android picks a custom font's weight by family. */
const GEIST_FAMILY_CLASSES = {
  normal: 'font-sans',
  medium: 'font-sans-medium',
  semibold: 'font-sans-semibold',
  bold: 'font-sans-bold',
} as const satisfies Readonly<Record<string, string>>;

// The important modifier is a prefix or a suffix of the class, and stays where it was.
const WEIGHT_CLASS = /^((?:[^:\s]+:)*!?)font-(normal|medium|semibold|bold)(!?)$/;

/** Renames each weight class in `className`, under any variant, to its Geist family class. */
function toGeistFamilies(className: string | undefined): string | undefined {
  return className
    ?.split(/\s+/)
    .map((token) => {
      const [, variants, weight, important] = WEIGHT_CLASS.exec(token) ?? [];
      return weight
        ? `${variants}${GEIST_FAMILY_CLASSES[weight as keyof typeof GEIST_FAMILY_CLASSES]}${important}`
        : token;
    })
    .join(' ');
}

type TextProps = ComponentProps<typeof NativeText> & {
  /** Renders the single child in place of a native Text, with Text's props and classes merged onto it. */
  asChild?: boolean;
};

function Text({ className, asChild = false, ...props }: TextProps): ReactNode {
  const textClass = useContext(TextClassContext);
  const Component = asChild ? Slot : NativeText;

  return (
    <Component
      className={cn('font-sans text-foreground text-base', toGeistFamilies(textClass), toGeistFamilies(className))}
      {...props}
    />
  );
}

export { Text, TextClassContext };
export type { TextProps };
