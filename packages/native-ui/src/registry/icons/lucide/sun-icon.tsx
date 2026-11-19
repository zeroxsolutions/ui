// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SunIcon} through. */
type SunIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back each ray starts to fade in after the one before it, and how long it takes: the web
 * twin's 0.1 and 0.3 s, in proportion.
 */
const STAGGER = 0.1;
const FADE = 0.3;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's sun icon, whose rays fade back in clockwise, one after another when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function SunIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const ray0 = useAnimatedProps(() => fadeIn(progress.value, 0 * STAGGER, 0 * STAGGER + FADE));
  const ray1 = useAnimatedProps(() => fadeIn(progress.value, 1 * STAGGER, 1 * STAGGER + FADE));
  const ray2 = useAnimatedProps(() => fadeIn(progress.value, 2 * STAGGER, 2 * STAGGER + FADE));
  const ray3 = useAnimatedProps(() => fadeIn(progress.value, 3 * STAGGER, 3 * STAGGER + FADE));
  const ray4 = useAnimatedProps(() => fadeIn(progress.value, 4 * STAGGER, 4 * STAGGER + FADE));
  const ray5 = useAnimatedProps(() => fadeIn(progress.value, 5 * STAGGER, 5 * STAGGER + FADE));
  const ray6 = useAnimatedProps(() => fadeIn(progress.value, 6 * STAGGER, 6 * STAGGER + FADE));
  const ray7 = useAnimatedProps(() => fadeIn(progress.value, 7 * STAGGER, 7 * STAGGER + FADE));

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
      <Circle cx="12" cy="12" r="4" />
      <AnimatedPath d="M12 2v2" animatedProps={ray0} />
      <AnimatedPath d="m19.07 4.93-1.41 1.41" animatedProps={ray1} />
      <AnimatedPath d="M20 12h2" animatedProps={ray2} />
      <AnimatedPath d="m17.66 17.66 1.41 1.41" animatedProps={ray3} />
      <AnimatedPath d="M12 20v2" animatedProps={ray4} />
      <AnimatedPath d="m6.34 17.66-1.41 1.41" animatedProps={ray5} />
      <AnimatedPath d="M2 12h2" animatedProps={ray6} />
      <AnimatedPath d="m4.93 4.93 1.41 1.41" animatedProps={ray7} />
    </Svg>
  );
}

export { SunIcon };
export type { SunIconHandle };
