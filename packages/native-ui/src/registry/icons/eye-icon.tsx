// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTiming,
  type IconHandle,
} from '../lib/icon-motion';

/** The handle a control starts and stops {@link EyeIcon} through. */
type EyeIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How long each way of the motion runs, in ms: half the web icon's. */
const TIMING: IconTiming = { duration: 200 };

/**
 * Lucide's eye icon, which half closes and returns when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function EyeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const lid = useAnimatedProps(() => ({
    ...transformProps({ scaleY: 1 - 0.9 * progress.value }),
    opacity: 1 - 0.7 * progress.value,
  }));
  const pupil = useAnimatedProps(() => ({
    ...transformProps({ scaleX: 1 - 0.7 * progress.value, scaleY: 1 - 0.7 * progress.value }),
    opacity: 1 - 0.7 * progress.value,
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
      <AnimatedPath
        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
        animatedProps={lid}
      />
      <AnimatedCircle cx="12" cy="12" r="3" animatedProps={pupil} />
    </Svg>
  );
}

export { EyeIcon };
export type { EyeIconHandle };
