// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SatelliteDishIcon} through. */
type SatelliteDishIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the dish tips back, in degrees about the middle, and dips at the far end of the way out, and its size: the
 * web twin's, which would take the dish's rim past the canvas, which react-native-svg clips, so it shrinks a little
 * as it tips.
 */
const TIP = -15;
const DIP = 1.5;
const SIZE = 0.9;

/** How far into the way back the outer wave starts to fade in after the inner, and how long each takes. */
const STAGGER = 0.3;
const FADE = 0.7;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's satellite-dish icon, which tips back and dips, its signal fading out and back in from the inside outwards
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function SatelliteDishIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const dish = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 1], [1, SIZE]);
    return transformProps({ y: DIP * progress.value, rotate: TIP * progress.value, scaleX: size, scaleY: size });
  });
  const inner = useAnimatedProps(() => fadeIn(progress.value, 0, FADE));
  const outer = useAnimatedProps(() => fadeIn(progress.value, STAGGER, STAGGER + FADE));

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
      <AnimatedG animatedProps={dish}>
        <Path d="M2.824 10.459a8 8 0 0010.717 10.717c.558-.276.623-1.012.183-1.452l-9.448-9.448c-.44-.44-1.176-.375-1.452.183" />
        <Path d="m9 15 4-4" />
        <AnimatedPath d="M18 12a6 6 0 00-6-6" animatedProps={inner} />
        <AnimatedPath d="M22 12A10 10 0 0012 2" animatedProps={outer} />
      </AnimatedG>
    </Svg>
  );
}

export { SatelliteDishIcon };
export type { SatelliteDishIconHandle };
