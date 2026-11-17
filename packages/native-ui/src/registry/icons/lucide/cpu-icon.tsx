// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CpuIcon} through. */
type CpuIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** A side's pins, stretched along their own length about the line through their middles, at `x` or `y`. */
function pins(progress: number, line: { x: number } | { y: number }): IconTransformProps & { opacity: number } {
  'worklet';
  const pulse = Math.sin(Math.PI * progress);
  const stretch = 1 + 0.5 * pulse;
  return {
    opacity: 1 - 0.2 * pulse,
    ...transformProps('x' in line ? { scaleX: stretch, originX: line.x } : { scaleY: stretch, originY: line.y }),
  };
}

/**
 * Lucide's cpu icon, whose pins stretch and dim, then settle, once each way when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function CpuIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const top = useAnimatedProps(() => pins(progress.value, { y: 3 }));
  const bottom = useAnimatedProps(() => pins(progress.value, { y: 21 }));
  const left = useAnimatedProps(() => pins(progress.value, { x: 3 }));
  const right = useAnimatedProps(() => pins(progress.value, { x: 21 }));

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
      <Rect width="16" height="16" x="4" y="4" rx="2" />
      <Rect width="8" height="8" x="8" y="8" rx="1" />
      <AnimatedG animatedProps={top}>
        <Path d="M12 2v2" />
        <Path d="M17 2v2" />
        <Path d="M7 2v2" />
      </AnimatedG>
      <AnimatedG animatedProps={bottom}>
        <Path d="M12 20v2" />
        <Path d="M17 20v2" />
        <Path d="M7 20v2" />
      </AnimatedG>
      <AnimatedG animatedProps={left}>
        <Path d="M2 12h2" />
        <Path d="M2 17h2" />
        <Path d="M2 7h2" />
      </AnimatedG>
      <AnimatedG animatedProps={right}>
        <Path d="M20 12h2" />
        <Path d="M20 17h2" />
        <Path d="M20 7h2" />
      </AnimatedG>
    </Svg>
  );
}

export { CpuIcon };
export type { CpuIconHandle };
