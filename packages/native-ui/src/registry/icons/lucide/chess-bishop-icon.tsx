// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChessBishopIcon} through. */
type ChessBishopIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's chess-bishop icon, which slides up and left, tilting, and fades away, then comes back, when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function ChessBishopIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // A rise of 0.8 and a tip of 8 degrees, less than the web twin's 6 and 16, which take the top past the canvas, which
  // react-native-svg clips.
  const bishop = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0.3, 0.8], [1, 0], Extrapolation.CLAMP),
    ...transformProps({ x: -2 * progress.value, y: -0.8 * progress.value, rotate: -8 * progress.value }),
  }));

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
      <AnimatedG animatedProps={bishop}>
        <Path d="M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
        <Path d="M15 18c1.5-.615 3-2.461 3-4.923C18 8.769 14.5 4.462 12 2 9.5 4.462 6 8.77 6 13.077 6 15.539 7.5 17.385 9 18" />
        <Path d="m16 7-2.5 2.5" />
        <Path d="M9 2h6" />
      </AnimatedG>
    </Svg>
  );
}

export { ChessBishopIcon };
export type { ChessBishopIconHandle };
