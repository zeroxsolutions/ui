// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BinaryIcon} through. */
type BinaryIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * How long one digit takes to turn out of view, and how far behind the last the next starts, as parts of the
 * motion.
 */
const FLIP = 0.12 / 0.42;
const STAGGER = 0.06 / 0.42;

/**
 * The digit at `index` in a cell whose middle is (`originX`, `originY`), turned on its horizontal axis: the one
 * shown at rest turns out of view, then the one hidden at rest turns into it. Flat on the screen, a turn shows as a
 * squash. The one hidden at rest is untransformed there, since react-native-svg drops a shape's matrix from its
 * first render.
 */
function flip(
  progress: number,
  index: number,
  entering: boolean,
  originX: number,
  originY: number,
): IconTransformProps & { opacity: number } {
  'worklet';
  const start = STAGGER * index + (entering ? FLIP : 0);
  const turned = interpolate(progress, [start, start + FLIP], [0, 1], Extrapolation.CLAMP);
  const shown = entering ? turned : 1 - turned;
  if (shown === 0) return { opacity: 0, ...transformProps({}) };
  return { opacity: shown, ...transformProps({ scaleY: Math.sin((shown * Math.PI) / 2), originX, originY }) };
}

/**
 * Lucide's binary icon, whose digits flip over one after another, each 0 turning into a 1 and each 1 into a 0, then
 * flip back, when started. The digits flipped in are hidden at rest. Hidden from a screen reader: the control around
 * it says what it does.
 */
function BinaryIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const zeroA = useAnimatedProps(() => flip(progress.value, 0, false, 8, 7));
  const oneA = useAnimatedProps(() => flip(progress.value, 0, true, 8, 7));
  const oneB = useAnimatedProps(() => flip(progress.value, 1, false, 16, 7));
  const zeroB = useAnimatedProps(() => flip(progress.value, 1, true, 16, 7));
  const oneC = useAnimatedProps(() => flip(progress.value, 2, false, 8, 17));
  const zeroC = useAnimatedProps(() => flip(progress.value, 2, true, 8, 17));
  const zeroD = useAnimatedProps(() => flip(progress.value, 3, false, 16, 17));
  const oneD = useAnimatedProps(() => flip(progress.value, 3, true, 16, 17));

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
      <AnimatedRect x="6" y="4" width="4" height="6" rx="2" animatedProps={zeroA} />
      <AnimatedG opacity={0} animatedProps={oneA}>
        <Path d="M6 4h2v6" />
        <Path d="M6 10h4" />
      </AnimatedG>
      <AnimatedG animatedProps={oneB}>
        <Path d="M14 4h2v6" />
        <Path d="M14 10h4" />
      </AnimatedG>
      <AnimatedRect x="14" y="4" width="4" height="6" rx="2" opacity={0} animatedProps={zeroB} />
      <AnimatedG animatedProps={oneC}>
        <Path d="M6 14h2v6" />
        <Path d="M6 20h4" />
      </AnimatedG>
      <AnimatedRect x="6" y="14" width="4" height="6" rx="2" opacity={0} animatedProps={zeroC} />
      <AnimatedRect x="14" y="14" width="4" height="6" rx="2" animatedProps={zeroD} />
      <AnimatedG opacity={0} animatedProps={oneD}>
        <Path d="M14 14h2v6" />
        <Path d="M14 20h4" />
      </AnimatedG>
    </Svg>
  );
}

export { BinaryIcon };
export type { BinaryIconHandle };
