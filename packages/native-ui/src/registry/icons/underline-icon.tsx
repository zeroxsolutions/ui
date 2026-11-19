// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link UnderlineIcon} through. */
type UnderlineIconHandle = IconHandle;

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the letter and the line, in the 24-unit viewBox. */
const LETTER = 30.85;
const LINE = 16;

/** The way out is quick, so the way back is what draws the strokes in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** A stroke `length` units long, drawn in from its end between `from` and `to` of the way through the draw. */
function stroke(drawn: number, from: number, to: number, length: number): ReturnType<typeof dash> {
  'worklet';
  const grown = interpolate(drawn, [from, to], [0, 1], Extrapolation.CLAMP);
  return { ...dash(length, grown, 1 - grown), opacity: grown };
}

/**
 * Lucide's underline icon, whose letter and line are drawn in again, the line last, when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function UnderlineIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const letter = useAnimatedProps(() => stroke(1 - progress.value, 0, 0.5, LETTER));
  const line = useAnimatedProps(() => stroke(1 - progress.value, 0.33, 1, LINE));

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
      <AnimatedPath d="M6 4v6a6 6 0 0 0 12 0V4" animatedProps={letter} />
      <AnimatedLine x1="4" x2="20" y1="20" y2="20" animatedProps={line} />
    </Svg>
  );
}

export { UnderlineIcon };
export type { UnderlineIconHandle };
