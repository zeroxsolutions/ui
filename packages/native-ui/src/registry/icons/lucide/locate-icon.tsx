// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LocateIcon} through. */
type LocateIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/** The way back overshoots, so the ring springs a little past its size before it settles. */
const TIMING: IconTiming = { backEasing: Easing.out(Easing.back(1.7)) };

/** The ring's radius at rest, and how far in it closes, in the 24-unit viewBox. */
const RADIUS = 7;
const CLOSED = 1;

/** How far each tick's outer end draws in as the ring closes. */
const PULL = 0.75;

/**
 * Lucide's locate icon, whose ring closes in on its middle and springs back past its size, its ticks following when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function LocateIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const ring = useAnimatedProps(() => ({ r: RADIUS - (RADIUS - CLOSED) * progress.value }));
  const west = useAnimatedProps(() => ({
    x1: 2 + PULL * progress.value,
    x2: 12 - RADIUS + (RADIUS - CLOSED) * progress.value,
  }));
  const east = useAnimatedProps(() => ({
    x1: 12 + RADIUS - (RADIUS - CLOSED) * progress.value,
    x2: 22 - PULL * progress.value,
  }));
  const north = useAnimatedProps(() => ({
    y1: 2 + PULL * progress.value,
    y2: 12 - RADIUS + (RADIUS - CLOSED) * progress.value,
  }));
  const south = useAnimatedProps(() => ({
    y1: 12 + RADIUS - (RADIUS - CLOSED) * progress.value,
    y2: 22 - PULL * progress.value,
  }));

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
      <AnimatedLine x1="2" x2="5" y1="12" y2="12" animatedProps={west} />
      <AnimatedLine x1="19" x2="22" y1="12" y2="12" animatedProps={east} />
      <AnimatedLine x1="12" x2="12" y1="2" y2="5" animatedProps={north} />
      <AnimatedLine x1="12" x2="12" y1="19" y2="22" animatedProps={south} />
      <AnimatedCircle cx="12" cy="12" r="7" animatedProps={ring} />
    </Svg>
  );
}

export { LocateIcon };
export type { LocateIconHandle };
