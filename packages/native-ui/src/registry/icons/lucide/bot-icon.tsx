// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BotIcon} through. */
type BotIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's bot icon, whose eyes blink shut and open again when started. Hidden from a screen reader: the control around
 * it says what it does.
 */
function BotIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const right = useAnimatedProps(() => ({ d: `M15 ${13 + progress.value}v${2 - 2 * progress.value}` }));
  const left = useAnimatedProps(() => ({ d: `M9 ${13 + progress.value}v${2 - 2 * progress.value}` }));

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
      <Path d="M12 8V4H8" />
      <Rect width="16" height="12" x="4" y="8" rx="2" />
      <Path d="M2 14h2" />
      <Path d="M20 14h2" />
      <AnimatedPath d="M15 13v2" animatedProps={right} />
      <AnimatedPath d="M9 13v2" animatedProps={left} />
    </Svg>
  );
}

export { BotIcon };
export type { BotIconHandle };
