// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTiming,
  type IconTransformProps,
  type IconHandle,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PaletteIcon} through. */
type PaletteIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the outline, in the 24-unit viewBox. */
const OUTLINE = 64.96;

/** Where each dot sits, in the order they pop in. */
const DOTS = [
  { cx: 6.5, cy: 12.5 },
  { cx: 8.5, cy: 7.5 },
  { cx: 13.5, cy: 6.5 },
  { cx: 17.5, cy: 10.5 },
];

/**
 * The dot at `index` growing from nothing once the outline is under way, each a tenth of the draw after the last, and
 * overshooting to 1.25 before it settles, as the web twin's spring does.
 */
function pop(progress: number, index: number): IconTransformProps {
  'worklet';
  const start = 0.4 + 0.1 * index;
  const scale = interpolate(1 - progress, [start, start + 0.2, start + 0.3], [0, 1.25, 1], Extrapolation.CLAMP);
  return transformProps({ scaleX: scale, scaleY: scale, originX: DOTS[index].cx, originY: DOTS[index].cy });
}

/** The way out is quick, so the way back is what draws the outline and pops the dots. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's palette icon, whose outline is drawn in again and whose four dots pop in one after another when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function PaletteIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const outline = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0, 0.5], [0, 1], Extrapolation.CLAMP);
    return dash(OUTLINE, drawn);
  });
  const first = useAnimatedProps(() => pop(progress.value, 0));
  const second = useAnimatedProps(() => pop(progress.value, 1));
  const third = useAnimatedProps(() => pop(progress.value, 2));
  const fourth = useAnimatedProps(() => pop(progress.value, 3));

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
        d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"
        animatedProps={outline}
      />
      <AnimatedCircle {...DOTS[0]} r=".5" fill={color} animatedProps={first} />
      <AnimatedCircle {...DOTS[1]} r=".5" fill={color} animatedProps={second} />
      <AnimatedCircle {...DOTS[2]} r=".5" fill={color} animatedProps={third} />
      <AnimatedCircle {...DOTS[3]} r=".5" fill={color} animatedProps={fourth} />
    </Svg>
  );
}

export { PaletteIcon };
export type { PaletteIconHandle };
