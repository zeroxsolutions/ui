// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SmartphoneNfcIcon} through. */
type SmartphoneNfcIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back each wave starts to fade in after the one inside it, and how long it takes.
 */
const STAGGER = 0.25;
const FADE = 0.5;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's smartphone-nfc icon, whose waves fade out and back in from the inside outwards when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function SmartphoneNfcIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const first = useAnimatedProps(() => fadeIn(progress.value, 0 * STAGGER, 0 * STAGGER + FADE));
  const second = useAnimatedProps(() => fadeIn(progress.value, 1 * STAGGER, 1 * STAGGER + FADE));
  const third = useAnimatedProps(() => fadeIn(progress.value, 2 * STAGGER, 2 * STAGGER + FADE));

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
      <Rect width="7" height="12" x="2" y="6" rx="1" />
      <AnimatedPath d="M13 8.32a7.43 7.43 0 0 1 0 7.36" animatedProps={first} />
      <AnimatedPath d="M16.46 6.21a11.76 11.76 0 0 1 0 11.58" animatedProps={second} />
      <AnimatedPath d="M19.91 4.1a15.91 15.91 0 0 1 .01 15.8" animatedProps={third} />
    </Svg>
  );
}

export { SmartphoneNfcIcon };
export type { SmartphoneNfcIconHandle };
