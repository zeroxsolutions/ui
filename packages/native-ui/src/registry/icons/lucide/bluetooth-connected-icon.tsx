// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BluetoothConnectedIcon} through. */
type BluetoothConnectedIconHandle = IconHandle;

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of each dash, in the 24-unit viewBox. */
const DASH = 3;

/** The way out is quick, so the way back is what draws the dashes in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's bluetooth-connected icon, whose two dashes either side of the rune are drawn in again, the rune flickering
 * back in after them, when started. Hidden from a screen reader: the control around it says what it does.
 */
function BluetoothConnectedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const rune = useAnimatedProps(() => ({
    opacity: interpolate(1 - progress.value, [0.4, 0.6, 0.8, 1], [0, 1, 0.5, 1], Extrapolation.CLAMP),
  }));
  const right = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0, 0.8], [0, 1], Extrapolation.CLAMP);
    return { ...dash(DASH, drawn, 1 - drawn), opacity: drawn };
  });
  const left = useAnimatedProps(() => {
    const shown = 1 - progress.value;
    return {
      ...dash(DASH, interpolate(shown, [0.2, 0.4], [0, 1], Extrapolation.CLAMP)),
      opacity: interpolate(shown, [0, 0.4], [0, 1], Extrapolation.CLAMP),
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
      <AnimatedPath d="m7 7 10 10-5 5V2l5 5L7 17" animatedProps={rune} />
      <AnimatedLine x1="18" x2="21" y1="12" y2="12" animatedProps={right} />
      <AnimatedLine x1="3" x2="6" y1="12" y2="12" animatedProps={left} />
    </Svg>
  );
}

export { BluetoothConnectedIcon };
export type { BluetoothConnectedIconHandle };
