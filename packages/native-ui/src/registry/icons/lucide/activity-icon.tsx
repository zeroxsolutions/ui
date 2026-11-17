// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ActivityIcon} through. */
type ActivityIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the pulse, in the 24-unit viewBox. */
const PULSE = 49.21;

/** The way out is quick, so the way back is what draws the pulse in, at an even pace as the web twin does. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp), backEasing: Easing.linear };

/**
 * Lucide's activity icon, whose pulse is drawn in again from nothing when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function ActivityIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const pulse = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return {
      ...dash(PULSE, drawn, 1 - drawn),
      opacity: interpolate(drawn, [0, 1 / 6], [0, 1], Extrapolation.CLAMP),
    };
  });

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
      <AnimatedPath
        d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
        animatedProps={pulse}
      />
    </Svg>
  );
}

export { ActivityIcon };
export type { ActivityIconHandle };
