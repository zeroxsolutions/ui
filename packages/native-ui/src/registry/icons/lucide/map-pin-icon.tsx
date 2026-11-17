// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MapPinIcon} through. */
type MapPinIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the pin lifts, in the 24-unit viewBox, and where it settles before it comes down: a fifth of the web twin's
 * 5 and 3, since Lucide's pin rests a unit below the top of the canvas, which react-native-svg clips.
 */
const LIFT = [0, -1, -0.6];

/** The length of the dot, 2 pi 3, in the 24-unit viewBox. */
const DOT = 18.85;

/**
 * Lucide's map-pin icon, which lifts while its dot is drawn in again from halfway round when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function MapPinIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => transformProps({ y: interpolate(progress.value, [0, 0.6, 1], LIFT) }));
  const dot = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return dash(DOT, drawn, 0.5 * (1 - drawn));
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
      <AnimatedG animatedProps={whole}>
        <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <AnimatedCircle cx="12" cy="10" r="3" animatedProps={dot} />
      </AnimatedG>
    </Svg>
  );
}

export { MapPinIcon };
export type { MapPinIconHandle };
