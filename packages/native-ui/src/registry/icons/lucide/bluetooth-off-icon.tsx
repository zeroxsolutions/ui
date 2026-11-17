// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BluetoothOffIcon} through. */
type BluetoothOffIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the rune's lower half, its upper half and the slash, in the 24-unit viewBox. */
const LOWER = 24.14;
const UPPER = 15.11;
const SLASH = 28.28;

/** The way out is quick, so the way back is what draws the rune and the slash in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's bluetooth-off icon, whose two halves of the rune are drawn in again from their ends, then the slash across
 * them, when started. Hidden from a screen reader: the control around it says what it does.
 */
function BluetoothOffIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const lower = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP);
    return { ...dash(LOWER, drawn, 1 - drawn), opacity: drawn };
  });
  const upper = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP);
    return { ...dash(UPPER, drawn, 1 - drawn), opacity: drawn };
  });
  const slash = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP);
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
      <AnimatedPath d="m17 17-5 5V12l-5 5" animatedProps={lower} />
      <AnimatedPath d="m2 2 20 20" animatedProps={slash} />
      <AnimatedPath d="M14.5 9.5 17 7l-5-5v4.5" animatedProps={upper} />
    </Svg>
  );
}

export { BluetoothOffIcon };
export type { BluetoothOffIconHandle };
