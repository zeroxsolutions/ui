// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BrainIcon} through. */
type BrainIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The lengths of the strokes that pull in, in the 24-unit viewBox. Lucide's top arc is drawn as two halves, each from
 * the middle, as the web twin draws it, so each pulls in on its own.
 */
const STEM = 13;
const SIDE = 10.72;
const TOP = 10.76;
const LOWER = 10.48;

/**
 * Lucide's brain icon, whose strokes pull in toward their ends while the whole brain swells and returns
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function BrainIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const width = Number.parseFloat(String(strokeWidth));
  const whole = useAnimatedProps(() => ({
    ...transformProps({ scaleX: 1 + 0.08 * progress.value, scaleY: 1 + 0.08 * progress.value }),
    strokeWidth: width * (1 + 0.125 * progress.value),
  }));
  const stem = useAnimatedProps(() => dash(STEM, 1 - 0.6 * progress.value, 0.25 * progress.value));
  const side = useAnimatedProps(() => dash(SIDE, 1 - 0.5 * progress.value, 0.25 * progress.value));
  const topRight = useAnimatedProps(() => dash(TOP, 1 - 0.2 * progress.value, 0.07 * progress.value));
  const topLeft = useAnimatedProps(() => dash(TOP, 1 - 0.2 * progress.value, 0.07 * progress.value));
  const lowerRight = useAnimatedProps(() => dash(LOWER, 1 - 0.2 * progress.value, 0.14 * progress.value));
  const lowerLeft = useAnimatedProps(() => dash(LOWER, 1 - 0.2 * progress.value, 0.14 * progress.value));

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
      <AnimatedG strokeWidth={strokeWidth} animatedProps={whole}>
        <AnimatedPath d="M12 18V5" animatedProps={stem} />
        <AnimatedPath d="M15 13a4.17 4.17 0 01-3-4 4.17 4.17 0 01-3 4" animatedProps={side} />
        <AnimatedPath d="M12 5A3 3 0 1 1 17.707 6.294" animatedProps={topRight} />
        <AnimatedPath d="M12 5A3 3 0 1 0 6.293 6.294" animatedProps={topLeft} />
        <Path d="M17.996 5.125a4 4 0 012.526 5.77" />
        <AnimatedPath d="M18 18a4 4 0 002-7.465" animatedProps={lowerRight} />
        <Path d="M19.967 17.482a4 4 0 11-7.967.517 4 4 0 11-7.967-.517" />
        <AnimatedPath d="M6 18a4 4 0 01-2-7.465" animatedProps={lowerLeft} />
        <Path d="M6.004 5.125a4 4 0 00-2.526 5.77" />
      </AnimatedG>
    </Svg>
  );
}

export { BrainIcon };
export type { BrainIconHandle };
