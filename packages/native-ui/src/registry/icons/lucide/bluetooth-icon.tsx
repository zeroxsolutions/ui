// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BluetoothIcon} through. */
type BluetoothIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the rune and of the stroke drawn over its upper half, in the 24-unit viewBox. */
const RUNE = 62.43;
const UPPER = 15.11;

/** The way out is quick, so the way back is what draws the rune in. */
const TIMING: IconTiming = { duration: 150, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's bluetooth icon, whose rune is drawn in again from its end, fading in, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function BluetoothIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const rune = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(RUNE, drawn, 1 - drawn), opacity: drawn };
  });
  const upper = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(UPPER, drawn, 1 - drawn), opacity: drawn };
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
      <AnimatedPath d="M14.5 9.5 17 7l-5-5v4.5" animatedProps={upper} />
    </Svg>
  );
}

export { BluetoothIcon };
export type { BluetoothIconHandle };
