// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ReceiptTextIcon} through. */
type ReceiptTextIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of each line, in the 24-unit viewBox, from the top. */
const FIRST = 6;
const SECOND = 8;
const THIRD = 5;

/** How far into the way out each line starts to be wiped after the one below it, and how long it takes. */
const STAGGER = 0.2;
const WIPE = 0.6;

/**
 * The stroke of a line `length` units long that is wiped back to its left end over its own stretch of the way out,
 * `order` lines after the first one wiped, and written in again over the same stretch of the way back.
 */
function wipe(progress: number, length: number, order: number): ReturnType<typeof dash> {
  'worklet';
  const drawn = 1 - interpolate(progress, [order * STAGGER, order * STAGGER + WIPE], [0, 1], Extrapolation.CLAMP);
  // Lucide draws each line from its right end, so its left end is the far end of the path.
  return dash(length, drawn, 1 - drawn);
}

/**
 * Lucide's receipt-text icon, whose lines are wiped, the last first, and written in again, the first first when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ReceiptTextIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const first = useAnimatedProps(() => wipe(progress.value, FIRST, 2));
  const second = useAnimatedProps(() => wipe(progress.value, SECOND, 1));
  const third = useAnimatedProps(() => wipe(progress.value, THIRD, 0));

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
      <Path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
      <AnimatedPath d="M14 8H8" animatedProps={first} />
      <AnimatedPath d="M16 12H8" animatedProps={second} />
      <AnimatedPath d="M13 16H8" animatedProps={third} />
    </Svg>
  );
}

export { ReceiptTextIcon };
export type { ReceiptTextIconHandle };
