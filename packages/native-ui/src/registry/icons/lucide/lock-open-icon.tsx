// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LockOpenIcon} through. */
type LockOpenIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where in the way out each step of the jiggle falls. */
const STEPS = [0, 1 / 3, 2 / 3, 1];

/** The jiggle, in degrees and in scale about the middle. */
const JIGGLE = [0, 2, 4, -2];
const SQUEEZE = [1, 1.05, 0.95, 1.02];

/** The length of the shackle's right leg, which Lucide leaves out, in the 24-unit viewBox. */
const LEG = 4;

/**
 * Lucide's lock-open icon, which jiggles while its shackle swings shut, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function LockOpenIcon({
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
  const shackle = useAnimatedProps(() => {
    const shut = interpolate(progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP);
    return { d: `M7 11V7a5 5 0 0 1 ${9.9 + 0.1 * shut} ${shut - 1}` };
  });
  const leg = useAnimatedProps(() => dash(LEG, interpolate(progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP)));

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
        <AnimatedPath d="M7 11V7a5 5 0 0 1 9.9-1" animatedProps={shackle} />
        {/* The shackle's right leg, which Lucide leaves out of the open lock: it comes down as the shackle shuts. */}
        <AnimatedPath d="M17 7v4" opacity={0} animatedProps={leg} />
      </AnimatedG>
    </Svg>
  );
}

export { LockOpenIcon };
export type { LockOpenIconHandle };
