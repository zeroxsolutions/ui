import * as ProgressPrimitive from '@rn-primitives/progress';
import { createContext, useContext, useLayoutEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { textOf } from '../lib/text-children';
import { cn } from '../lib/utils';
import { Text } from './text';

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/text` for its text classes; the registry
// build replaces each with the classes translated for the target engine.

/** What the parts of a Progress read from it: the value it draws, and where a ProgressLabel names it. */
interface ProgressState {
  /** The value from 0 to 100 the bar is filled to. */
  value: number;
  setLabel: (label: string | undefined) => void;
}

const ProgressContext = createContext<ProgressState>({ value: 0, setLabel: () => {} });

type ProgressProps = Omit<ProgressPrimitive.RootProps, 'max' | 'value'> & {
  /** How far along the task is, from 0 to 100. A value outside that range is held to its nearest end, and none or NaN draws an empty bar. */
  value?: number;
};

/**
 * A bar showing how far a task has got. It is announced as a progress bar from 0 to 100, with the
 * value as a percentage. With no children the bar is the Progress itself, and `className` styles the bar; with a
 * ProgressLabel or a ProgressValue as children, they sit on a row above the bar, `className` styles that row, and
 * the label names the progress bar unless it has an `aria-label`.
 */
function Progress({ className, value = 0, children, 'aria-label': ariaLabel, ...props }: ProgressProps): ReactNode {
  const filled = Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
  const [label, setLabel] = useState<string | undefined>(undefined);

  if (children === undefined || children === null) {
    return (
      <ProgressContext.Provider value={{ value: filled, setLabel }}>
        <ProgressPrimitive.Root
          value={filled}
          aria-label={ariaLabel}
          className={cn('w-full overflow-hidden cn-progress', className)}
          {...props}
        >
          <ProgressIndicator />
        </ProgressPrimitive.Root>
      </ProgressContext.Provider>
    );
  }

  return (
    <ProgressContext.Provider value={{ value: filled, setLabel }}>
      <ProgressPrimitive.Root
        value={filled}
        aria-label={ariaLabel ?? label}
        className={cn('w-full flex-row flex-wrap items-center gap-3', className)}
        {...props}
      >
        {children}
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </ProgressPrimitive.Root>
    </ProgressContext.Provider>
  );
}

/** The muted bar a Progress fills, the full width of its row; a Progress with children draws one itself. */
function ProgressTrack({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View
      className={cn('relative w-full flex-row items-center overflow-hidden cn-progress-track', className)}
      {...props}
    />
  );
}

/** The filled part of the bar, as wide as the Progress's value; a Progress draws one itself. */
function ProgressIndicator({ className, style, ...props }: ProgressPrimitive.IndicatorProps): ReactNode {
  const { value } = useContext(ProgressContext);
  const width = { width: `${value}%` } as const;
  return (
    <ProgressPrimitive.Indicator
      className={cn('h-full cn-progress-indicator', className)}
      style={style === undefined ? width : [width, style]}
      {...props}
    />
  );
}

type ProgressLabelProps = ComponentProps<typeof Text>;

/** What the progress is of, such as `Upload`, at the start of the row; its text names the progress bar. */
function ProgressLabel({ className, children, ...props }: ProgressLabelProps): ReactNode {
  const { setLabel } = useContext(ProgressContext);
  const label = textOf(children);

  useLayoutEffect(() => {
    setLabel(label === '' ? undefined : label);
    return () => setLabel(undefined);
  }, [setLabel, label]);

  return (
    <Text className={cn('cn-progress-label/text', className)} {...props}>
      {children}
    </Text>
  );
}

type ProgressValueProps = Omit<ComponentProps<typeof Text>, 'children'> & {
  /** What to draw in place of the percentage, or a function of the percentage as text and the value. */
  children?: ReactNode | ((formattedValue: string, value: number) => ReactNode);
};

/** The value as a whole percentage, such as `40%`, muted at the end of the row. */
function ProgressValue({ className, children, ...props }: ProgressValueProps): ReactNode {
  const { value } = useContext(ProgressContext);
  const formatted = `${Math.round(value)}%`;
  return (
    <Text className={cn('cn-progress-value cn-progress-value/text', className)} {...props}>
      {typeof children === 'function' ? children(formatted, value) : (children ?? formatted)}
    </Text>
  );
}

export { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue };
export type { ProgressLabelProps, ProgressProps, ProgressValueProps };
