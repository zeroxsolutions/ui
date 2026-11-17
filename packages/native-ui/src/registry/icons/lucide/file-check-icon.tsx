// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FileCheckIcon} through. */
type FileCheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the tick in; half the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 8.49;

/**
 * Lucide's file-check icon, whose tick is drawn in again from nothing when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function FileCheckIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const tick = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(TICK, drawn), opacity: drawn };
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
      <Path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <Path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <AnimatedPath d="m9 15 2 2 4-4" animatedProps={tick} />
    </Svg>
  );
}

export { FileCheckIcon };
export type { FileCheckIconHandle };
