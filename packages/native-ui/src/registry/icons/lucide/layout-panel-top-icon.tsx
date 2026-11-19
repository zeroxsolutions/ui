// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LayoutPanelTopIcon} through. */
type LayoutPanelTopIconHandle = IconHandle;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** The way out is quick, so the way back is what slides the panels in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far each panel slides in from, in the 24-unit viewBox: the web twin's 5 and 10 would show them past the
 * canvas while they fade in, which react-native-svg clips.
 */
const SLIDE = 2;

/**
 * The place and opacity of a panel that slides in from (`x`, `y`) and fades in over its own stretch of the way
 * back, from `start` to `end` of it.
 */
function slideIn(
  progress: number,
  x: number,
  y: number,
  start: number,
  end: number,
): IconTransformProps & { opacity: number } {
  'worklet';
  const away = 1 - interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return { ...transformProps({ x: x * away, y: y * away }), opacity: 1 - away };
}

/**
 * Lucide's layout-panel-top icon, whose panels slide in and fade in one after another when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function LayoutPanelTopIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => slideIn(progress.value, 0, -SLIDE, 0, 0.55));
  const left = useAnimatedProps(() => slideIn(progress.value, -SLIDE, 0, 0.33, 0.9));
  const right = useAnimatedProps(() => slideIn(progress.value, SLIDE, 0, 0.44, 1));

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
      <AnimatedRect width="18" height="7" x="3" y="3" rx="1" animatedProps={top} />
      <AnimatedRect width="7" height="7" x="3" y="14" rx="1" animatedProps={left} />
      <AnimatedRect width="7" height="7" x="14" y="14" rx="1" animatedProps={right} />
    </Svg>
  );
}

export { LayoutPanelTopIcon };
export type { LayoutPanelTopIconHandle };
