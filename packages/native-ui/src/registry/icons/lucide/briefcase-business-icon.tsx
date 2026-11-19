// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BriefcaseBusinessIcon} through. */
type BriefcaseBusinessIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's briefcase-business icon, which sways to one side and the other from its handle, then settles, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function BriefcaseBusinessIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const briefcase = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], [0, 4, -3]), originY: 4 }),
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
      <AnimatedG animatedProps={briefcase}>
        <Path d="M12 12h.01" />
        <Path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <Path d="M22 13a18.15 18.15 0 0 1-20 0" />
        <Rect width="20" height="14" x="2" y="6" rx="2" />
      </AnimatedG>
    </Svg>
  );
}

export { BriefcaseBusinessIcon };
export type { BriefcaseBusinessIconHandle };
