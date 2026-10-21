import * as SwitchPrimitive from '@rn-primitives/switch';
import { cva } from 'class-variance-authority';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { cn } from '../lib/utils';

// A `cn-<slot>` token stands for that slot's classes and `cn-<slot>@<state>` for the classes
// the style puts behind that state, such as `@checked+size=sm`; the registry build replaces each with the
// classes translated for the target engine.
const switchVariants = cva('flex-row items-center cn-switch', {
  variants: {
    size: {
      default: 'cn-switch@size=default',
      sm: 'cn-switch@size=sm',
    },
    checked: {
      true: 'cn-switch@checked',
      false: 'cn-switch@unchecked',
    },
  },
});

const switchThumbVariants = cva('cn-switch-thumb', {
  variants: {
    size: {
      default: 'cn-switch-thumb@size=default',
      sm: 'cn-switch-thumb@size=sm',
    },
    checked: {
      true: 'cn-switch-thumb@checked',
      false: 'cn-switch-thumb@unchecked',
    },
  },
  compoundVariants: [
    { size: 'default', checked: true, className: 'cn-switch-thumb@checked+size=default' },
    { size: 'default', checked: false, className: 'cn-switch-thumb@size=default+unchecked' },
    { size: 'sm', checked: true, className: 'cn-switch-thumb@checked+size=sm' },
    { size: 'sm', checked: false, className: 'cn-switch-thumb@size=sm+unchecked' },
  ],
});

/** How far the thumb travels between its ends, matching the translate classes of each size. */
const THUMB_TRAVEL = { default: 14, sm: 10 } as const;
const THUMB_SLIDE_MS = 150;

const AnimatedThumb = Animated.createAnimatedComponent(SwitchPrimitive.Thumb);

/** Whether the system asks for less motion, kept up to date while the component is mounted. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

/**
 * The thumb. The classes put it at its end at once, so on a change it starts back at the end it
 * came from and slides to its own, unless the system asks for reduced motion.
 */
function SwitchThumb({ size, checked }: { size: 'default' | 'sm'; checked: boolean }): ReactNode {
  const offset = useRef(new Animated.Value(0)).current;
  const previous = useRef(checked);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (previous.current === checked) return;
    previous.current = checked;
    if (reduced) return;
    const travel = THUMB_TRAVEL[size];
    offset.setValue(checked ? -travel : travel);
    const slide = Animated.timing(offset, {
      toValue: 0,
      duration: THUMB_SLIDE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    slide.start();
    return () => slide.stop();
  }, [checked, size, reduced, offset]);

  return (
    <AnimatedThumb className={switchThumbVariants({ size, checked })} style={{ transform: [{ translateX: offset }] }} />
  );
}

type SwitchProps = SwitchPrimitive.RootProps & {
  /** `sm` draws a 24px track; the default is 32px. */
  size?: 'default' | 'sm';
  /**
   * Draws the destructive border. React Native does not announce it, so carry the error in
   * `accessibilityHint` or in a Text the user can reach.
   */
  'aria-invalid'?: boolean;
};

/**
 * An on/off control, announced as a switch with its checked and disabled state. It is controlled:
 * pressing it calls `onCheckedChange` with the new value, and it moves only once `checked` follows.
 * The thumb slides between its ends in 150ms, or jumps when the system asks for reduced motion. A
 * disabled switch is dimmed and ignores presses. Name it with `aria-label`, which both platforms
 * read; Android also reads a Label's nativeID through `aria-labelledby`.
 */
function Switch({
  className,
  size = 'default',
  checked,
  disabled,
  'aria-invalid': invalid,
  ...props
}: SwitchProps): ReactNode {
  return (
    <SwitchPrimitive.Root
      className={cn(
        switchVariants({ size, checked }),
        invalid && 'cn-switch@invalid',
        disabled && 'opacity-50',
        className,
      )}
      checked={checked}
      disabled={disabled}
      aria-invalid={invalid}
      {...props}
    >
      <SwitchThumb size={size} checked={checked} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
export type { SwitchProps };
