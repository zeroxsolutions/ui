// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ExternalLinkIcon} through. */
type ExternalLinkIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's external-link icon, whose arrow shrinks a little and moves out towards its corner, and back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function ExternalLinkIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrow = useAnimatedProps(() => {
    const scale = 1 - 0.08 * progress.value;
    return transformProps({
      x: 2 * progress.value,
      y: -2 * progress.value,
      scaleX: scale,
      scaleY: scale,
      originX: 21,
      originY: 3,
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
      <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <AnimatedG animatedProps={arrow}>
        <Path d="M15 3h6v6" />
        <Path d="M10 14 21 3" />
      </AnimatedG>
    </Svg>
  );
}

export { ExternalLinkIcon };
export type { ExternalLinkIconHandle };
