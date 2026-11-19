// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MicIcon} through. */
type MicIconHandle = IconHandle;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * How far the capsule bobs up at the middle of the way out, and how much it shrinks about its foot as it does: the
 * web twin's 3 would take its top past the canvas, which react-native-svg clips, so it bobs half as far, shrinking a
 * little.
 */
const BOB = [0, -1.5, 0];
const SIZE = [1, 0.96, 1];

/**
 * Lucide's mic icon, whose capsule bobs up twice when started. Hidden from a screen reader: the control around it says
 * what it does.
 */
function MicIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const capsule = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], SIZE);
    return transformProps({
      y: interpolate(progress.value, [0, 0.5, 1], BOB),
      scaleX: size,
      scaleY: size,
      originX: 12,
      originY: 15,
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
      <Path d="M12 19v3" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <AnimatedRect x="9" y="2" width="6" height="13" rx="3" animatedProps={capsule} />
    </Svg>
  );
}

export { MicIcon };
export type { MicIconHandle };
