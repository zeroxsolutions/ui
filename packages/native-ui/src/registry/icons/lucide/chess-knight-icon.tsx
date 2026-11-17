// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChessKnightIcon} through. */
type ChessKnightIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How high the knight hops and how far it rears back, in 24-unit viewBox units and degrees about the middle of its
 * base, and its size as it does: the web twin's 12 and 42 would take the ears past the canvas, which react-native-svg
 * clips, so it hops and rears less and shrinks towards its base.
 */
const HOP = -1;
const TIP = 15;
const SIZE = 0.85;

/**
 * Lucide's chess-knight icon, which hops, rearing back on its base, and lands again when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function ChessKnightIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const knight = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], [1, SIZE, SIZE]);
    return transformProps({
      y: HOP * progress.value,
      rotate: TIP * progress.value,
      scaleX: size,
      scaleY: size,
      originY: 22,
    });
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
      <AnimatedG animatedProps={knight}>
        <Path d="M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
        <Path d="M16.5 18c1-2 2.5-5 2.5-9a7 7 0 0 0-7-7H6.635a1 1 0 0 0-.768 1.64L7 5l-2.32 5.802a2 2 0 0 0 .95 2.526l2.87 1.456" />
        <Path d="m15 5 1.425-1.425" />
        <Path d="m17 8 1.53-1.53" />
        <Path d="M9.713 12.185 7 18" />
      </AnimatedG>
    </Svg>
  );
}

export { ChessKnightIcon };
export type { ChessKnightIconHandle };
