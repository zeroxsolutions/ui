// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TicketIcon} through. */
type TicketIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far each half slides from the tear at (13, 12), how far the right half tilts about it, and the size of both
 * there: the web twin slides each by 3, which would take them past the canvas, which react-native-svg clips, so each
 * slides by 2, shrinking a little about the tear. The tilt is the web twin's.
 */
const SLIDE = 2;
const TILT = 4;
const SIZE = 0.86;

/**
 * Lucide's ticket icon, which tears along its perforation, its right half tilting away, and closes again when started.
 * Lucide's outline is drawn in two halves, split at the perforation as the web twin splits it, so each half moves on
 * its own. Hidden from a screen reader: the control around it says what it does.
 */
function TicketIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const left = useAnimatedProps(() => {
    const size = 1 - (1 - SIZE) * progress.value;
    return transformProps({ x: -SLIDE * progress.value, scaleX: size, scaleY: size, originX: 13, originY: 12 });
  });
  const right = useAnimatedProps(() => {
    const size = 1 - (1 - SIZE) * progress.value;
    return transformProps({
      x: SLIDE * progress.value,
      rotate: TILT * progress.value,
      scaleX: size,
      scaleY: size,
      originX: 13,
      originY: 12,
    });
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
      <AnimatedG animatedProps={left}>
        <Path d="M13 5H4a2 2 0 0 0-2 2v2a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h9" />
        <Path d="M13 5v2" />
        <Path d="M13 11v2" />
        <Path d="M13 17v2" />
      </AnimatedG>
      <AnimatedPath d="M13 5h7a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2h-7" animatedProps={right} />
    </Svg>
  );
}

export { TicketIcon };
export type { TicketIconHandle };
