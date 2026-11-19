// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChessPawnIcon} through. */
type ChessPawnIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's chess-pawn icon, whose head sways to one side and the other, rolling as it goes, while its body leans on its
 * base, when started. Hidden from a screen reader: the control around it says what it does.
 */
function ChessPawnIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const body = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.3, 1], [0, 5, 4]), originY: 21 }),
  );
  const head = useAnimatedProps(() =>
    transformProps({
      x: interpolate(progress.value, [0, 0.5, 1], [0, -5, 5]),
      rotate: interpolate(progress.value, [0, 0.5, 1], [0, -15, 15]),
      originY: 6,
    }),
  );

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
      <AnimatedG animatedProps={body}>
        <Path d="M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
        <Path d="m14.5 10 1.5 8" />
        <Path d="M7 10h10" />
        <Path d="m8 18 1.5-8" />
      </AnimatedG>
      <AnimatedCircle cx="12" cy="6" r="4" animatedProps={head} />
    </Svg>
  );
}

export { ChessPawnIcon };
export type { ChessPawnIconHandle };
