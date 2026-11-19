// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import { useId, type ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ConstructionIcon} through. */
type ConstructionIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the stripes slide, in the 24-unit viewBox: one stripe's width. */
const STRIPE = 6;

/**
 * Lucide's construction icon, whose barrier's stripes slide one stripe along and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ConstructionIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const clipId = useId();
  const stripes = useAnimatedProps(() => transformProps({ x: STRIPE * progress.value }));
  const entering = useAnimatedProps(() => ({ opacity: progress.value > 0 ? 1 : 0 }));

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
      <Defs>
        <ClipPath id={clipId}>
          <Rect width="22" height="10" x="1" y="5" />
        </ClipPath>
      </Defs>
      <Rect x="2" y="6" width="20" height="8" rx="1" />
      <Path d="M17 14v7" />
      <Path d="M7 14v7" />
      <Path d="M17 3v3" />
      <Path d="M7 3v3" />
      <G clipPath={`url(#${clipId})`}>
        <AnimatedG animatedProps={stripes}>
          <AnimatedPath d="M4 14-3.7 6.3" animatedProps={entering} />
          <Path d="M10 14 2.3 6.3" />
          <Path d="m14 6 7.7 7.7" />
          <Path d="m8 6 8 8" />
        </AnimatedG>
      </G>
    </Svg>
  );
}

export { ConstructionIcon };
export type { ConstructionIconHandle };
