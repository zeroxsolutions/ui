// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link ListTodoIcon} through. */
type ListTodoIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 8.49;

/**
 * Lucide's list todo icon, whose lines slide right, whose box shrinks and whose tick is drawn in again, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ListTodoIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const firstLine = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 2 * p }) };
  });
  const secondLine = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return { ...transformProps({ x: 2 * p }) };
  });
  const thirdLine = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.16) / 0.84);
    return { ...transformProps({ x: 2 * p }) };
  });
  const tick = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(TICK, drawn) };
  });
  const box = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 - 0.15 * p, scaleY: 1 - 0.15 * p, originX: 6, originY: 7 }) };
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
      <AnimatedPath d="M13 5h8" animatedProps={firstLine} />
      <AnimatedPath d="M13 12h8" animatedProps={secondLine} />
      <AnimatedPath d="M13 19h8" animatedProps={thirdLine} />
      <AnimatedPath d="m3 17 2 2 4-4" animatedProps={tick} />
      <AnimatedRect x="3" y="4" width="6" height="6" rx="1" animatedProps={box} />
    </Svg>
  );
}

export { ListTodoIcon };
export type { ListTodoIconHandle };
