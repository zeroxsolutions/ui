// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ShowerHeadIcon} through. */
type ShowerHeadIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far into the way out each drop starts to dim after the one before it, how long it takes, and how faint it
 * gets: the web twin's 0.2 s stagger and its dip to 0.2, in proportion.
 */
const STAGGER = 0.1;
const DIM = 0.4;
const FAINT = 0.2;

/** The opacity of the drop that starts to dim `start` of the way out. */
function drop(progress: number, start: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [start, start + DIM], [1, FAINT], Extrapolation.CLAMP) };
}

/**
 * Lucide's shower-head icon, whose drops dim one after another and come back when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function ShowerHeadIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const drop0 = useAnimatedProps(() => drop(progress.value, 0 * STAGGER));
  const drop1 = useAnimatedProps(() => drop(progress.value, 1 * STAGGER));
  const drop2 = useAnimatedProps(() => drop(progress.value, 2 * STAGGER));
  const drop3 = useAnimatedProps(() => drop(progress.value, 3 * STAGGER));
  const drop4 = useAnimatedProps(() => drop(progress.value, 4 * STAGGER));
  const drop5 = useAnimatedProps(() => drop(progress.value, 5 * STAGGER));
  const drop6 = useAnimatedProps(() => drop(progress.value, 6 * STAGGER));

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
      <Path d="m4 4 2.5 2.5" />
      <Path d="M13.5 6.5a4.95 4.95 0 0 0-7 7" />
      <Path d="M15 5 5 15" />
      <AnimatedPath d="M14 17v.01" animatedProps={drop0} />
      <AnimatedPath d="M10 16v.01" animatedProps={drop1} />
      <AnimatedPath d="M13 13v.01" animatedProps={drop2} />
      <AnimatedPath d="M16 10v.01" animatedProps={drop3} />
      <AnimatedPath d="M11 20v.01" animatedProps={drop4} />
      <AnimatedPath d="M17 14v.01" animatedProps={drop5} />
      <AnimatedPath d="M20 11v.01" animatedProps={drop6} />
    </Svg>
  );
}

export { ShowerHeadIcon };
export type { ShowerHeadIconHandle };
