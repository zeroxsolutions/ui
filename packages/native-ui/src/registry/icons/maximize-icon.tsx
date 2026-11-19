// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link MaximizeIcon} through. */
type MaximizeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's maximize icon, whose four corners move outward and back, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function MaximizeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const topLeft = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: -2 * p, y: -2 * p }) };
  });
  const topRight = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 2 * p, y: -2 * p }) };
  });
  const bottomLeft = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: -2 * p, y: 2 * p }) };
  });
  const bottomRight = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 2 * p, y: 2 * p }) };
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
      <AnimatedPath d="M8 3H5a2 2 0 0 0-2 2v3" animatedProps={topLeft} />
      <AnimatedPath d="M21 8V5a2 2 0 0 0-2-2h-3" animatedProps={topRight} />
      <AnimatedPath d="M3 16v3a2 2 0 0 0 2 2h3" animatedProps={bottomLeft} />
      <AnimatedPath d="M16 21h3a2 2 0 0 0 2-2v-3" animatedProps={bottomRight} />
    </Svg>
  );
}

export { MaximizeIcon };
export type { MaximizeIconHandle };
