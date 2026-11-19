// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AlignVerticalSpaceAroundIcon} through. */
type AlignVerticalSpaceAroundIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Lucide's align-vertical-space-around icon, whose block flattens while its two edges close in and shorten, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function AlignVerticalSpaceAroundIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const block = useAnimatedProps(() => transformProps({ scaleY: 1 - 0.2 * progress.value }));
  const lower = useAnimatedProps(() =>
    transformProps({ y: -2 * progress.value, scaleX: 1 - 0.1 * progress.value, originY: 20 }),
  );
  const upper = useAnimatedProps(() =>
    transformProps({ y: 2 * progress.value, scaleX: 1 - 0.1 * progress.value, originY: 4 }),
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
      <AnimatedRect width="10" height="6" x="7" y="9" rx="2" animatedProps={block} />
      <AnimatedPath d="M22 20H2" animatedProps={lower} />
      <AnimatedPath d="M22 4H2" animatedProps={upper} />
    </Svg>
  );
}

export { AlignVerticalSpaceAroundIcon };
export type { AlignVerticalSpaceAroundIconHandle };
