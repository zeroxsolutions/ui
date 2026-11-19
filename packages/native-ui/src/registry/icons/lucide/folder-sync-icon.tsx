// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderSyncIcon} through. */
type FolderSyncIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How much the arrows shrink through the turn, as a fraction of their size: the web twin keeps them whole, and turned
 * whole they would sweep past the canvas, which react-native-svg clips.
 */
const SHRINK = 0.25;

/**
 * Lucide's folder-sync icon, whose arrows turn a full turn backwards about their middle and unwind when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function FolderSyncIcon({
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
    return transformProps({ rotate: -360 * progress.value, originX: 17, originY: 16, scaleX: scale, scaleY: scale });
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
      <Path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5" />
      <AnimatedG animatedProps={arrows}>
        <Path d="M12 10v4h4" />
        <Path d="m12 14 1.535-1.605a5 5 0 0 1 8 1.5" />
        <Path d="M22 22v-4h-4" />
        <Path d="m22 18-1.535 1.605a5 5 0 0 1-8-1.5" />
      </AnimatedG>
    </Svg>
  );
}

export { FolderSyncIcon };
export type { FolderSyncIconHandle };
