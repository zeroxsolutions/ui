// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ShipIcon} through. */
type ShipIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The rock, in degrees about the ship's middle (12, 11.38) at each half of the way out: the web twin's. */
const ROCK = [0, -3, 3];

/** The length of the wave, in the 24-unit viewBox. */
const WAVE = 22.1;

/**
 * The stroke of a part `length` units long, drawn in over its own stretch of the way back, from `start` to `end`
 * of it, beginning at its far end when `fromEnd`.
 */
function drawIn(
  progress: number,
  length: number,
  start: number,
  end: number,
  fromEnd = false,
): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return dash(length, drawn, fromEnd ? 1 - drawn : 0);
}

/**
 * Lucide's ship icon, which rocks on its wave as the wave is drawn in again when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function ShipIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const ship = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], ROCK), originX: 12, originY: 11.38 }),
  );
  // The wave waits a quarter of the way back, as the web twin's waits 0.15 s.
  const wave = useAnimatedProps(() => drawIn(progress.value, WAVE, 0.25, 1));

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
      <AnimatedPath
        d="M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
        animatedProps={wave}
      />
      <AnimatedG animatedProps={ship}>
        <Path d="M19.38 19A11.6 11.6 0 0021 13l-8.188-3.639a2 2 0 00-1.624 0L3 13.001a11.6 11.6 0 002.81 7.76" />
        <Path d="M19 12V6a2 2 0 00-2-2H7a2 2 0 00-2 2v6" />
        <Path d="M12 9.189V13" />
        <Path d="M12 2v2" />
      </AnimatedG>
    </Svg>
  );
}

export { ShipIcon };
export type { ShipIconHandle };
