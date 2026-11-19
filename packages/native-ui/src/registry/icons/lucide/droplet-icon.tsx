// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link DropletIcon} through. */
type DropletIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the drop in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the drop's outline, in the 24-unit viewBox. */
const OUTLINE = 50.54;

/**
 * Lucide's droplet icon, drawn in again from nothing, beginning from the end of its outline when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function DropletIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const drop = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0.25, 1], [0, 1], Extrapolation.CLAMP);
    return dash(OUTLINE, drawn, 1 - drawn);
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
        d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"
        animatedProps={drop}
      />
    </Svg>
  );
}

export { DropletIcon };
export type { DropletIconHandle };
