// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link EyeOffIcon} through. */
type EyeOffIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the slash, in the 24-unit viewBox. */
const SLASH = 28.28;

/** The way out is quick, so the way back is what draws the slash in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's eye-off icon, whose slash is drawn in again from nothing when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function EyeOffIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const slash = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(SLASH, drawn), opacity: drawn };
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
      <Path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <Path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <Path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <AnimatedPath d="m2 2 20 20" animatedProps={slash} />
    </Svg>
  );
}

export { EyeOffIcon };
export type { EyeOffIconHandle };
