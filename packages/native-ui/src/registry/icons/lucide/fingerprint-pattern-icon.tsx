// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FingerprintPatternIcon} through. */
type FingerprintPatternIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what traces the ridges in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * The stroke of a ridge `length` units long in the 24-unit viewBox, traced from a tenth of it to all of it over the
 * way back, and showing from halfway through it.
 */
function ridge(progress: number, length: number): ReturnType<typeof dash> {
  'worklet';
  const shown = 1 - progress;
  return {
    ...dash(length, interpolate(shown, [0, 1], [0.1, 1])),
    opacity: interpolate(shown, [0.25, 0.5], [0, 1], Extrapolation.CLAMP),
  };
}

/**
 * Lucide's fingerprint-pattern icon, whose ridges are traced in again over their faint outlines when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function FingerprintPatternIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const ridge0 = useAnimatedProps(() => ridge(progress.value, 7.15));
  const ridge1 = useAnimatedProps(() => ridge(progress.value, 8.98));
  const ridge2 = useAnimatedProps(() => ridge(progress.value, 3.06));
  const ridge3 = useAnimatedProps(() => ridge(progress.value, 24.98));
  const ridge4 = useAnimatedProps(() => ridge(progress.value, 0.01));
  const ridge5 = useAnimatedProps(() => ridge(progress.value, 6.01));
  const ridge6 = useAnimatedProps(() => ridge(progress.value, 9.63));
  const ridge7 = useAnimatedProps(() => ridge(progress.value, 2.08));
  const ridge8 = useAnimatedProps(() => ridge(progress.value, 14.57));

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
      <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" strokeOpacity={0.4} />
      <AnimatedPath d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" animatedProps={ridge0} />
      <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" strokeOpacity={0.4} />
      <AnimatedPath d="M14 13.12c0 2.38 0 6.38-1 8.88" animatedProps={ridge1} />
      <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" strokeOpacity={0.4} />
      <AnimatedPath d="M17.29 21.02c.12-.6.43-2.3.5-3.02" animatedProps={ridge2} />
      <Path d="M2 12a10 10 0 0 1 18-6" strokeOpacity={0.4} />
      <AnimatedPath d="M2 12a10 10 0 0 1 18-6" animatedProps={ridge3} />
      <Path d="M2 16h.01" strokeOpacity={0.4} />
      <AnimatedPath d="M2 16h.01" animatedProps={ridge4} />
      <Path d="M21.8 16c.2-2 .131-5.354 0-6" strokeOpacity={0.4} />
      <AnimatedPath d="M21.8 16c.2-2 .131-5.354 0-6" animatedProps={ridge5} />
      <Path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" strokeOpacity={0.4} />
      <AnimatedPath d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" animatedProps={ridge6} />
      <Path d="M8.65 22c.21-.66.45-1.32.57-2" strokeOpacity={0.4} />
      <AnimatedPath d="M8.65 22c.21-.66.45-1.32.57-2" animatedProps={ridge7} />
      <Path d="M9 6.8a6 6 0 0 1 9 5.2v2" strokeOpacity={0.4} />
      <AnimatedPath d="M9 6.8a6 6 0 0 1 9 5.2v2" animatedProps={ridge8} />
    </Svg>
  );
}

export { FingerprintPatternIcon };
export type { FingerprintPatternIconHandle };
