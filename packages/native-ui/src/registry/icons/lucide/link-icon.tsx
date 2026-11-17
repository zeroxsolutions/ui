// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LinkIcon} through. */
type LinkIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the upper half of the link, in the 24-unit viewBox. */
const UPPER = 30.78;

/** The length of the lower half of the link, in the 24-unit viewBox. */
const LOWER = 30.78;

/**
 * Lucide's link icon, whose two halves each draw a little shorter at both ends and tilt a few degrees
 * anticlockwise, the same way, then return, when started. Hidden from a screen reader: the control around it
 * says what it does.
 */
function LinkIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const upper = useAnimatedProps(() => {
    const p = progress.value;
    const drawn = 1 - 0.1 * progress.value;
    return {
      ...dash(UPPER, drawn, 0.05 * progress.value),
      ...transformProps({ rotate: -5 * p, originX: 15.973, originY: 8.536 }),
    };
  });
  const lower = useAnimatedProps(() => {
    const p = progress.value;
    const drawn = 1 - 0.1 * progress.value;
    return {
      ...dash(LOWER, drawn, 0.05 * progress.value),
      ...transformProps({ rotate: -5 * p, originX: 8.027, originY: 15.464 }),
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
      <AnimatedPath d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" animatedProps={upper} />
      <AnimatedPath d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" animatedProps={lower} />
    </Svg>
  );
}

export { LinkIcon };
export type { LinkIconHandle };
