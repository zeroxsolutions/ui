// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TimerIcon} through. */
type TimerIconHandle = IconHandle;

const AnimatedLine = Animated.createAnimatedComponent(Line);

/** How far the hand sweeps, in degrees about the middle (12, 14): the web twin's. */
const SWEEP = 300;

/** How far the button presses down and how narrow it gets about its middle (12, 2): the web twin's. */
const PRESS = 1;
const NARROW = 0.9;

/**
 * Lucide's timer icon, whose button presses down as its hand sweeps round, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function TimerIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const button = useAnimatedProps(() =>
    transformProps({ y: PRESS * progress.value, scaleX: 1 - (1 - NARROW) * progress.value, originX: 12, originY: 2 }),
  );
  const hand = useAnimatedProps(() => transformProps({ rotate: SWEEP * progress.value, originX: 12, originY: 14 }));

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
      <AnimatedLine x1="10" x2="14" y1="2" y2="2" animatedProps={button} />
      <AnimatedLine x1="12" x2="15" y1="14" y2="11" animatedProps={hand} />
      <Circle cx="12" cy="14" r="8" />
    </Svg>
  );
}

export { TimerIcon };
export type { TimerIconHandle };
