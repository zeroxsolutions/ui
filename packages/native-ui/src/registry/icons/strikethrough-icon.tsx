// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link StrikethroughIcon} through. */
type StrikethroughIconHandle = IconHandle;

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the strike line, in the 24-unit viewBox. */
const STRIKE = 16;

/**
 * Lucide's strikethrough icon, whose halves part while the line is drawn in again, when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function StrikethroughIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const upper = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: -1.5 * p }) };
  });
  const lower = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: 1.5 * p }) };
  });
  const strike = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(STRIKE, drawn) };
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
      <AnimatedPath d="M16 4H9a3 3 0 0 0-2.83 4" animatedProps={upper} />
      <AnimatedPath d="M14 12a4 4 0 0 1 0 8H6" animatedProps={lower} />
      <AnimatedLine x1="4" x2="20" y1="12" y2="12" animatedProps={strike} />
    </Svg>
  );
}

export { StrikethroughIcon };
export type { StrikethroughIconHandle };
