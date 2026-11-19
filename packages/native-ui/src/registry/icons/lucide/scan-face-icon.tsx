// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ScanFaceIcon} through. */
type ScanFaceIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How much the whole face shrinks about the middle: the web twin's. */
const FACE = 0.9;

/** How far each corner turns, in degrees about its own middle, and how much it grows as it fades: the web twin's. */
const CORNER_TURN = 45;
const CORNER_GROW = 1.2;

/** How much the mouth shrinks about its own middle (12, 15) as it fades: the web twin's. */
const MOUTH = 0.8;

/** The turn, size and opacity of a corner about its own middle (`x`, `y`). */
function corner(progress: number, x: number, y: number): IconTransformProps & { opacity: number } {
  'worklet';
  const size = 1 + (CORNER_GROW - 1) * progress;
  return {
    ...transformProps({ rotate: CORNER_TURN * progress, scaleX: size, scaleY: size, originX: x, originY: y }),
    opacity: 1 - progress,
  };
}

/**
 * Lucide's scan-face icon, whose corners spin away and back as the face shrinks a little when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ScanFaceIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const face = useAnimatedProps(() => {
    const size = 1 - (1 - FACE) * progress.value;
    return transformProps({ scaleX: size, scaleY: size });
  });
  const topLeft = useAnimatedProps(() => corner(progress.value, 5, 5));
  const topRight = useAnimatedProps(() => corner(progress.value, 19, 5));
  const bottomRight = useAnimatedProps(() => corner(progress.value, 19, 19));
  const bottomLeft = useAnimatedProps(() => corner(progress.value, 5, 19));
  // The mouth waits a quarter of the way out, as the web twin's waits 0.1 s of its 0.4.
  const mouth = useAnimatedProps(() => {
    const out = interpolate(progress.value, [0.25, 1], [0, 1], Extrapolation.CLAMP);
    const size = 1 - (1 - MOUTH) * out;
    return { ...transformProps({ scaleX: size, scaleY: size, originX: 12, originY: 15 }), opacity: 1 - out };
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
      <AnimatedG animatedProps={face}>
        <AnimatedPath d="M3 7V5a2 2 0 0 1 2-2h2" animatedProps={topLeft} />
        <AnimatedPath d="M17 3h2a2 2 0 0 1 2 2v2" animatedProps={topRight} />
        <AnimatedPath d="M21 17v2a2 2 0 0 1-2 2h-2" animatedProps={bottomRight} />
        <AnimatedPath d="M7 21H5a2 2 0 0 1-2-2v-2" animatedProps={bottomLeft} />
        <AnimatedPath d="M8 14s1.5 2 4 2 4-2 4-2" animatedProps={mouth} />
        <Path d="M9 9h.01" />
        <Path d="M15 9h.01" />
      </AnimatedG>
    </Svg>
  );
}

export { ScanFaceIcon };
export type { ScanFaceIconHandle };
