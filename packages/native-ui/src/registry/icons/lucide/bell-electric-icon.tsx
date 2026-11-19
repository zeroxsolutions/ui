// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BellElectricIcon} through. */
type BellElectricIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A part rattled to `turn` degrees and (`x`, `y`) one way, then as far the other, about (`originX`, `originY`). */
function rattle(
  progress: number,
  turn: number,
  x: number,
  y: number,
  originX: number,
  originY: number,
  swell = 0,
  shrink = 0,
): IconTransformProps {
  'worklet';
  const sway = interpolate(progress, [0, 0.5, 1], [0, -1, 1]);
  const scale = interpolate(progress, [0, 0.5, 1], [1, 1 + swell, 1 - shrink]);
  return transformProps({
    rotate: turn * sway,
    x: x * sway,
    y: y * sway,
    scaleX: scale,
    scaleY: scale,
    originX,
    originY,
  });
}

/**
 * Lucide's bell-electric icon, which rattles side to side while its outer arc and its clapper rattle on their own,
 * then settles, when started. Hidden from a screen reader: the control around it says what it does.
 */
function BellElectricIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // Less than the web twin's 12 degrees and 1.5 and 1 across, which with the clapper's 1.6 and 1.2 take the bell past
  // the canvas, which react-native-svg clips.
  const bell = useAnimatedProps(() => rattle(progress.value, 8, 0.5, 0.5, 12, 12));
  const arc = useAnimatedProps(() => rattle(progress.value, 6, 0.8, 0.5, 19.4, 6.5));
  const clapper = useAnimatedProps(() => rattle(progress.value, 10, 0.6, 0.6, 9, 9, 0.08, 0.05));

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
      <AnimatedG animatedProps={bell}>
        <Path d="M18.518 17.347A7 7 0 0 1 14 19" />
        <AnimatedPath d="M18.8 4A11 11 0 0 1 20 9" animatedProps={arc} />
        <AnimatedPath d="M9 9h.01" animatedProps={clapper} />
        <Circle cx="9" cy="9" r="7" />
        <Rect x="4" y="16" width="10" height="6" rx="2" />
        <Circle cx="20" cy="16" r="2" />
      </AnimatedG>
    </Svg>
  );
}

export { BellElectricIcon };
export type { BellElectricIconHandle };
