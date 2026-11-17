// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AlignHorizontalSpaceAroundIcon} through. */
type AlignHorizontalSpaceAroundIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Lucide's align-horizontal-space-around icon, whose block narrows while its two edges close in and shorten, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function AlignHorizontalSpaceAroundIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const block = useAnimatedProps(() => transformProps({ scaleX: 1 - 0.15 * progress.value }));
  const left = useAnimatedProps(() =>
    transformProps({ x: 2 * progress.value, scaleY: 1 - 0.1 * progress.value, originX: 4 }),
  );
  const right = useAnimatedProps(() =>
    transformProps({ x: -2 * progress.value, scaleY: 1 - 0.1 * progress.value, originX: 20 }),
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
      <AnimatedRect width="6" height="10" x="9" y="7" rx="2" animatedProps={block} />
      <AnimatedPath d="M4 22V2" animatedProps={left} />
      <AnimatedPath d="M20 22V2" animatedProps={right} />
    </Svg>
  );
}

export { AlignHorizontalSpaceAroundIcon };
export type { AlignHorizontalSpaceAroundIconHandle };
