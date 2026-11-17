// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ItalicIcon} through. */
type ItalicIconHandle = IconHandle;

const AnimatedLine = Animated.createAnimatedComponent(Line);

/** The lengths of the two bars and the slant, in the 24-unit viewBox. */
const TOP = 9;
const SLANT = 17.09;

/** The way out is quick, so the way back is what draws the strokes in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/** A stroke `length` units long, drawn in from its end between `from` and `to` of the way through the draw. */
function stroke(drawn: number, from: number, to: number, length: number): ReturnType<typeof dash> {
  'worklet';
  const grown = interpolate(drawn, [from, to], [0, 1], Extrapolation.CLAMP);
  return { ...dash(length, grown, 1 - grown), opacity: grown };
}

/**
 * Lucide's italic icon, whose three strokes are drawn in again, the slant last, when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ItalicIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => stroke(1 - progress.value, 0, 0.4, TOP));
  const bottom = useAnimatedProps(() => stroke(1 - progress.value, 0, 0.4, TOP));
  const slant = useAnimatedProps(() => stroke(1 - progress.value, 0.2, 1, SLANT));

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
      <AnimatedLine x1="19" x2="10" y1="4" y2="4" animatedProps={top} />
      <AnimatedLine x1="14" x2="5" y1="20" y2="20" animatedProps={bottom} />
      <AnimatedLine x1="15" x2="9" y1="4" y2="20" animatedProps={slant} />
    </Svg>
  );
}

export { ItalicIcon };
export type { ItalicIconHandle };
