// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PauseIcon} through. */
type PauseIconHandle = IconHandle;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** How far each bar dips, in the 24-unit viewBox: the web twin's. */
const DIP = 2;

/** Where in the way out each step of the dips falls: the left bar's dip, then the right's. */
const STEPS = [0, 0.4, 1];

/**
 * Lucide's pause icon, whose bars dip one after the other when started. Hidden from a screen reader: the control around
 * it says what it does.
 */
function PauseIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const left = useAnimatedProps(() => transformProps({ y: interpolate(progress.value, STEPS, [0, DIP, 0]) }));
  const right = useAnimatedProps(() => transformProps({ y: interpolate(progress.value, STEPS, [0, 0, DIP]) }));

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
      <AnimatedRect x="14" y="3" width="5" height="18" rx="1" animatedProps={right} />
      <AnimatedRect x="5" y="3" width="5" height="18" rx="1" animatedProps={left} />
    </Svg>
  );
}

export { PauseIcon };
export type { PauseIconHandle };
