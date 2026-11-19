// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link BoldIcon} through. */
type BoldIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's bold icon (letter B), whose stroke thickens and thins back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function BoldIcon({
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
  const letter = useAnimatedProps(() => ({ strokeWidth: width * (1 + 0.75 * progress.value) }));

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
      <AnimatedPath d="M6 12h9a4 4 0 010 8H7a1 1 0 01-1-1V5a1 1 0 011-1h7a4 4 0 010 8" animatedProps={letter} />
    </Svg>
  );
}

export { BoldIcon };
export type { BoldIconHandle };
