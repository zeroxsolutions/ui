// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LockKeyholeIcon} through. */
type LockKeyholeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where in the way out each step of the jiggle falls. */
const STEPS = [0, 1 / 3, 2 / 3, 1];

/** The jiggle, in degrees and in scale about the middle. */
const JIGGLE = [0, -3, 1, -2];
const SQUEEZE = [1, 0.95, 1.05, 0.98];

/** The length of the shackle, in the 24-unit viewBox. */
const SHACKLE = 21.71;

/**
 * Lucide's lock-keyhole icon, which jiggles while its shackle presses down, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function LockKeyholeIcon({
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
    const scale = interpolate(progress.value, STEPS, SQUEEZE);
    return transformProps({ rotate: interpolate(progress.value, STEPS, JIGGLE), scaleX: scale, scaleY: scale });
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
        <Circle cx="12" cy="16" r="1" />
        <Rect x="3" y="10" width="18" height="12" rx="2" />
        <AnimatedPath d="M7 10V7a5 5 0 0 1 10 0v3" animatedProps={shackle} />
      </AnimatedG>
    </Svg>
  );
}

export { LockKeyholeIcon };
export type { LockKeyholeIconHandle };
