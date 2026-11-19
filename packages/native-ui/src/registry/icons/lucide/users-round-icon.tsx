// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link UsersRoundIcon} through. */
type UsersRoundIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, as the web twin jumps to where it starts, so the way back is what slides it in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** How far the second traveller starts to the left of where it rests: the web twin's. */
const SLIDE = 4;

/**
 * Lucide's users-round icon, whose second traveller fades in as it slides out from behind the first when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function UsersRoundIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const second = useAnimatedProps(() => ({
    opacity: 1 - progress.value,
    ...transformProps({ x: -SLIDE * progress.value }),
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
      <Path d="M18 21a8 8 0 0 0-16 0" />
      <Circle cx="10" cy="8" r="5" />
      <AnimatedPath d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" animatedProps={second} />
    </Svg>
  );
}

export { UsersRoundIcon };
export type { UsersRoundIconHandle };
