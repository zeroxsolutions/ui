// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link FrameIcon} through. */
type FrameIconHandle = IconHandle;

const AnimatedLine = Animated.createAnimatedComponent(Line);

/**
 * Lucide's frame icon, whose four guides slide outward and back, when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function FrameIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const top = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: -4 * p }) };
  });
  const bottom = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: 4 * p }) };
  });
  const left = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: -4 * p }) };
  });
  const right = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 4 * p }) };
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
      <AnimatedLine x1="22" x2="2" y1="6" y2="6" animatedProps={top} />
      <AnimatedLine x1="22" x2="2" y1="18" y2="18" animatedProps={bottom} />
      <AnimatedLine x1="6" x2="6" y1="2" y2="22" animatedProps={left} />
      <AnimatedLine x1="18" x2="18" y1="2" y2="22" animatedProps={right} />
    </Svg>
  );
}

export { FrameIcon };
export type { FrameIconHandle };
