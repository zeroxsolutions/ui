// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TextQuoteIcon} through. */
type TextQuoteIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's text quote icon, whose lines slide and whose quote bar shortens, then all return, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function TextQuoteIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const first = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 - 0.3 * p, originX: 3, originY: 5 }) };
  });
  // Each line slides 2, less than the web twin's 2.5, which takes its end past the canvas, which react-native-svg
  // clips.
  const second = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return { ...transformProps({ x: 2 * p }) };
  });
  const third = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.16) / 0.84);
    return { ...transformProps({ x: 2 * p }) };
  });
  const bar = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleY: 1 - 0.4 * p, originX: 3 }) };
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
      <AnimatedPath d="M17 5H3" animatedProps={first} />
      <AnimatedPath d="M21 12H8" animatedProps={second} />
      <AnimatedPath d="M21 19H8" animatedProps={third} />
      <AnimatedPath d="M3 12v7" animatedProps={bar} />
    </Svg>
  );
}

export { TextQuoteIcon };
export type { TextQuoteIconHandle };
