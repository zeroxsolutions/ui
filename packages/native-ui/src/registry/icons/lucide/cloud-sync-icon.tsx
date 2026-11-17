// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudSyncIcon} through. */
type CloudSyncIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How much the arrows shrink through the turn, as a fraction of their size: the web twin keeps them whole, and turned
 * whole they would sweep past the canvas, which react-native-svg clips.
 */
const SHRINK = 0.15;

/**
 * Lucide's cloud-sync icon, whose arrows turn a full turn backwards about their middle and unwind when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function CloudSyncIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrows = useAnimatedProps(() => {
    const scale = 1 - SHRINK * interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
    return transformProps({ rotate: -360 * progress.value, originY: 16, scaleX: scale, scaleY: scale });
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
      <Path d="M20.996 15.251A4.5 4.5 0 0 0 17.495 8h-1.79a7 7 0 1 0-12.709 5.607" />
      <AnimatedG animatedProps={arrows}>
        <Path d="m17 18-1.535 1.605a5 5 0 0 1-8-1.5" />
        <Path d="M17 22v-4h-4" />
        <Path d="M7 10v4h4" />
        <Path d="m7 14 1.535-1.605a5 5 0 0 1 8 1.5" />
      </AnimatedG>
    </Svg>
  );
}

export { CloudSyncIcon };
export type { CloudSyncIconHandle };
