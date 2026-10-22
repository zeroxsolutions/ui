import { LoaderCircle } from 'lucide-react-native';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { cn } from '../lib/utils';
import { Icon, type IconProps } from './icon';

const TURN_MS = 1000;

/**
 * The classes a container gives every Spinner inside it, merged over the spinner's own 16px and under its
 * `className`, such as the larger size attachment media gives a spinner when it stands above the text.
 */
const SpinnerClassContext = createContext<string | undefined>(undefined);

type SpinnerProps = Omit<IconProps, 'as'> & {
  /** What is loading, read by screen readers; defaults to "Loading". */
  'aria-label'?: string;
};

/**
 * A circle that turns while something loads, announced as a busy progress bar named by `aria-label`.
 * It stands still while the person has asked the system to reduce motion. Its `className` styles the
 * icon, 16px by default, and inside a Button it takes the button's label colour.
 */
function Spinner({ className, 'aria-label': label = 'Loading', ...props }: SpinnerProps): ReactNode {
  const spinnerClass = useContext(SpinnerClassContext);
  // Unknown until the setting is read, and still until then, so a person who reduces motion never sees a turn.
  const [reducedMotion, setReducedMotion] = useState<boolean | undefined>(undefined);
  const rotation = useRef(new Animated.Value(0)).current;
  const turning = reducedMotion === false;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!turning) return undefined;
    const turn = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: TURN_MS, easing: Easing.linear, useNativeDriver: true }),
    );
    turn.start();
    return () => turn.stop();
  }, [turning, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      accessible
      role="progressbar"
      aria-label={label}
      aria-busy
      style={turning ? { transform: [{ rotate }] } : undefined}
    >
      <Icon as={LoaderCircle} className={cn('size-4', spinnerClass, className)} {...props} />
    </Animated.View>
  );
}

export { Spinner, SpinnerClassContext };
export type { SpinnerProps };
