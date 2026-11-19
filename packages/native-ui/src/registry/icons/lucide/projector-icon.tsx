// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ProjectorIcon} through. */
type ProjectorIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How much the body grows about its middle, and how far it rises, in the 24-unit viewBox: the web twin's. */
const GROW = 1.08;
const RISE = 1;

/** The length of each ray, in the 24-unit viewBox. */
const SLANT = 2.83;
const UPRIGHT = 3;

/**
 * Lucide's projector icon, whose body bobs up, growing, while its rays are drawn in again when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ProjectorIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const body = useAnimatedProps(() => {
    const size = 1 + (GROW - 1) * progress.value;
    return transformProps({ y: -RISE * progress.value, scaleX: size, scaleY: size, originX: 12, originY: 15 });
  });
  const left = useAnimatedProps(() => dash(SLANT, 1 - progress.value));
  const middle = useAnimatedProps(() => dash(UPRIGHT, 1 - progress.value));
  const right = useAnimatedProps(() => dash(SLANT, 1 - progress.value));

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
      <AnimatedPath d="M5 7 3 5" animatedProps={left} />
      <AnimatedPath d="M9 6V3" animatedProps={middle} />
      <AnimatedPath d="m13 7 2-2" animatedProps={right} />
      <AnimatedG animatedProps={body}>
        <Circle cx="9" cy="13" r="3" />
        <Path d="M11.83 12H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.17" />
        <Path d="M16 16h2" />
      </AnimatedG>
    </Svg>
  );
}

export { ProjectorIcon };
export type { ProjectorIconHandle };
