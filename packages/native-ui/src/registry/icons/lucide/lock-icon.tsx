// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LockIcon} through. */
type LockIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the shackle, in the 24-unit viewBox. */
const SHACKLE = 23.71;

/** Where in the way out each step of the rattle falls. */
const RATTLE = [0, 0.25, 0.5, 0.75, 1];

/**
 * Lucide's lock icon, which rattles while its shackle pulls shorter and returns when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function LockIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => {
    const scale = interpolate(progress.value, RATTLE, [1, 0.95, 1.05, 0.98, 1]);
    return {
      ...transformProps({
        rotate: interpolate(progress.value, RATTLE, [0, -3, 1, -2, 0]),
        scaleX: scale,
        scaleY: scale,
      }),
    };
  });
  const shackle = useAnimatedProps(() => dash(SHACKLE, 1 - 0.3 * progress.value));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AnimatedG animatedProps={whole}>
        <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <AnimatedPath d="M7 11V7a5 5 0 0 1 10 0v4" animatedProps={shackle} />
      </AnimatedG>
    </Svg>
  );
}

export { LockIcon };
export type { LockIconHandle };
