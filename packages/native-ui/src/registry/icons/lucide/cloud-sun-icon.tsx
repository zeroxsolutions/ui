// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudSunIcon} through. */
type CloudSunIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of the sun's part `index`, the first back in on the way back and the last out on the way out. */
function ray(progress: number, index: number): { opacity: number } {
  'worklet';
  const start = 0.6 - 0.15 * index;
  return { opacity: interpolate(progress, [start, start + 0.3], [1, 0], Extrapolation.CLAMP) };
}

/**
 * Lucide's cloud-sun icon, whose cloud jiggles while the sun's rays fade out and in again one after another when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function CloudSunIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cloud = useAnimatedProps(() => {
    const shift = interpolate(progress.value, [0, 0.5, 1], [0, -1, 1]);
    return transformProps({ x: shift, y: shift });
  });
  const ray0 = useAnimatedProps(() => ray(progress.value, 0));
  const ray1 = useAnimatedProps(() => ray(progress.value, 1));
  const ray2 = useAnimatedProps(() => ray(progress.value, 2));
  const ray3 = useAnimatedProps(() => ray(progress.value, 3));
  const ray4 = useAnimatedProps(() => ray(progress.value, 4));

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
      <AnimatedPath d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" animatedProps={cloud} />
      <AnimatedPath d="M12 2v2" animatedProps={ray0} />
      <AnimatedPath d="m4.93 4.93 1.41 1.41" animatedProps={ray1} />
      <AnimatedPath d="M20 12h2" animatedProps={ray2} />
      <AnimatedPath d="m19.07 4.93-1.41 1.41" animatedProps={ray3} />
      <AnimatedPath d="M15.947 12.65a4 4 0 0 0-5.925-4.128" animatedProps={ray4} />
    </Svg>
  );
}

export { CloudSunIcon };
export type { CloudSunIconHandle };
